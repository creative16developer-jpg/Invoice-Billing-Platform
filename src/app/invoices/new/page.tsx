'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { ElegantTemplate } from '@/components/templates/ElegantTemplate';
import { ThermalTemplate } from '@/components/templates/ThermalTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog, useDialog } from '@/components/ui/ConfirmDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import toast from 'react-hot-toast';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Plus, Trash2, Download, Save, Eye, Palette, User, Phone, MapPin, Calendar as CalendarIcon, AlertCircle, Settings, Copy, Search,
  CheckCircle2
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { format, parse } from 'date-fns';

interface InvoiceItem {
  date: string;
  description: string;
  weightOrQty: string;
  rate: number;
  amount: number;
}

// Helpers to parse and format dates safely between UI picking and DB strings
const parseDateString = (str: string): Date => {
  if (!str) return new Date();
  try {
    const parsed = parse(str, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch (e) {}
  
  const native = new Date(str);
  if (!isNaN(native.getTime())) return native;
  
  return new Date();
};

const formatDateString = (date: Date): string => {
  if (!date) return '';
  return format(date, 'dd/MM/yyyy');
};

const parseWeightOrQty = (val: string) => {
  if (!val) return { value: '', unit: 'Pcs' };
  const match = val.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (match) {
    const value = match[1];
    const unit = match[2] || 'Pcs';
    const normalizedUnit = ['Pcs', 'kg', 'gm', 'liter', 'ml'].find(
      u => u.toLowerCase() === unit.toLowerCase()
    ) || 'Pcs';
    return { value, unit: normalizedUnit };
  }
  return { value: val, unit: 'Pcs' };
};

function InvoiceEditorContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { dialogProps, confirm } = useDialog();

  // Customer Module State
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saveToContacts, setSaveToContacts] = useState(false);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  // Items Autocomplete State
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  const [activeItemDropdownIndex, setActiveItemDropdownIndex] = useState<number | null>(null);

  // Form State
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    date: '',
    dueDate: '',
    items: [] as InvoiceItem[],
    taxPercent: 0,
    discountAmount: 0,
    terms: '',
    status: 'Unpaid' as 'Paid' | 'Unpaid',
    templateId: 'classic',
    templateCustomization: {
      primaryColor: '#b91c1c',
      secondaryColor: '#1f2937',
      fontFamily: 'Inter',
      showLogo: true,
      showSignature: true,
      signatureName: '',
      signatureUrl: ''
    }
  });

  // Calculate totals on the fly
  const subtotal = invoiceForm.items.reduce((acc, item) => acc + (item.amount || 0), 0);
  const taxAmount = (subtotal * invoiceForm.taxPercent) / 100;
  const totalAmount = subtotal + taxAmount - invoiceForm.discountAmount;

  // Convert number to words (for live preview before saving)
  const getNumberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const cleanNum = Math.round(num);
    if (cleanNum === 0) return 'Zero Rupees';

    const convertLessThanThousand = (n: number): string => {
      if (n < 20) return a[n];
      const digit = n % 10;
      if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
      return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + convertLessThanThousand(n % 100));
    };

    const convert = (n: number): string => {
      if (n < 1000) return convertLessThanThousand(n);
      if (n < 100000) return convertLessThanThousand(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convertLessThanThousand(n % 1000) : '');
      if (n < 10000000) return convertLessThanThousand(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
      return convertLessThanThousand(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    };

    return (convert(cleanNum) + 'Rupees Only').trim().replace(/\s+/g, ' ');
  };

  const totalAmountInWords = getNumberToWords(totalAmount);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setCustomers(res);
      } catch (err) {
        console.error('Failed to load customers', err);
      }
    };
    const fetchItems = async () => {
      try {
        const res = await api.get('/items');
        setItemsCatalog(res);
      } catch (err) {
        console.error('Failed to load items catalog', err);
      }
    };
    if (user) {
      fetchCustomers();
      fetchItems();
    }
  }, [user]);

  const handleCustomerSelect = (id: string | null) => {
    if (!id) {
      setSelectedCustomerId('');
      setCustomerSearchInput('');
      setInvoiceForm(prev => ({
        ...prev,
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
      return;
    }
    setSelectedCustomerId(id);
    const selected = customers.find(c => c._id === id);
    if (selected) {
      setCustomerSearchInput(selected.name);
      setInvoiceForm(prev => ({
        ...prev,
        customerName: selected.name,
        customerPhone: selected.phone || '',
        customerAddress: selected.address || ''
      }));
      setErrors(prev => ({
        ...prev,
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
    } else {
      setInvoiceForm(prev => ({
        ...prev,
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
    }
  };

  useEffect(() => {
    if (invoiceForm.customerName && customers.length > 0) {
      const matched = customers.find(c => c.name.toLowerCase() === invoiceForm.customerName.toLowerCase());
      if (matched) {
        setSelectedCustomerId(matched._id);
        setCustomerSearchInput(matched.name);
        setCustomerMode('existing');
      }
    }
  }, [invoiceForm.customerName, customers]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !invoiceId) {
      // Setup Defaults for New Invoice
      const today = new Date();
      const dateStr = formatDateString(today);
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const dueStr = formatDateString(nextWeek);

      // Unique random Invoice number
      const randomInvNum = Math.floor(10 + Math.random() * 90);

      setInvoiceForm({
        invoiceNumber: String(randomInvNum),
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        date: dateStr,
        dueDate: dueStr,
        items: [
          { date: dateStr, description: '', weightOrQty: user.productCategory === 'Bakery' ? '1.5 kg' : '1', rate: 0, amount: 0 }
        ],
        taxPercent: user.productCategory === 'Bakery' ? 0 : 18, // 18% GST default for electronics/other
        discountAmount: 0,
        terms: user.templateSettings?.customTerms || '',
        status: 'Unpaid',
        templateId: user.templateSettings?.headerLayout || 'classic',
        templateCustomization: {
          primaryColor: user.templateSettings?.primaryColor || '#b91c1c',
          secondaryColor: user.templateSettings?.secondaryColor || '#1f2937',
          fontFamily: user.templateSettings?.fontFamily || 'Inter',
          showLogo: user.templateSettings?.showLogo !== false,
          showSignature: user.templateSettings?.showSignature !== false,
          signatureName: user.templateSettings?.signatureName || user.ownerName,
          signatureUrl: user.templateSettings?.signatureUrl || ''
        }
      });
    }

    if (user && invoiceId) {
      // Fetch Existing Invoice for Editing
      const fetchInvoice = async () => {
        try {
          setLoading(true);
          const data = await api.get(`/invoices/${invoiceId}`);
          setInvoiceForm({
            invoiceNumber: data.invoiceNumber,
            customerName: data.customerName,
            customerPhone: data.customerPhone || '',
            customerAddress: data.customerAddress || '',
            date: data.date,
            dueDate: data.dueDate || '',
            items: data.items,
            taxPercent: data.taxPercent || 0,
            discountAmount: data.discountAmount || 0,
            terms: data.terms || '',
            status: data.status || 'Unpaid',
            templateId: data.templateId || 'classic',
            templateCustomization: {
              primaryColor: data.templateCustomization?.primaryColor || user.templateSettings?.primaryColor || '#b91c1c',
              secondaryColor: data.templateCustomization?.secondaryColor || user.templateSettings?.secondaryColor || '#1f2937',
              fontFamily: data.templateCustomization?.fontFamily || user.templateSettings?.fontFamily || 'Inter',
              showLogo: data.templateCustomization?.showLogo !== false,
              showSignature: data.templateCustomization?.showSignature !== false,
              signatureName: data.templateCustomization?.signatureName || user.templateSettings?.signatureName || user.ownerName,
              signatureUrl: user.templateSettings?.signatureUrl || ''
            }
          });
        } catch (err) {
          console.error(err);
          toast.error('Failed to load invoice');
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [user, invoiceId, authLoading]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoiceForm({ ...invoiceForm, [name]: value });
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleCustomizationChange = (name: string, value: any) => {
    setInvoiceForm({
      ...invoiceForm,
      templateCustomization: {
        ...invoiceForm.templateCustomization,
        [name]: value
      }
    });
  };

  // Item table handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceForm.items];
    const item = { ...updatedItems[index] };
    
    if (field === 'rate') {
      const rateVal = Number(value) || 0;
      item.rate = rateVal;
      const qtyMatch = String(item.weightOrQty).match(/([\d.]+)/);
      const qtyVal = qtyMatch ? Number(qtyMatch[1]) : 1;
      item.amount = rateVal * qtyVal;
    } else if (field === 'weightOrQty') {
      item.weightOrQty = value;
      const qtyMatch = String(value).match(/([\d.]+)/);
      const qtyVal = qtyMatch ? Number(qtyMatch[1]) : 1;
      item.amount = item.rate * qtyVal;
    } else {
      (item as any)[field] = value;
    }

    updatedItems[index] = item;
    setInvoiceForm({ ...invoiceForm, items: updatedItems });

    // Clean field errors on edit or set validation message for decimal Pcs
    const errKey = `item_${index}_${field}`;
    let customError = '';
    if (field === 'weightOrQty') {
      const parsed = parseWeightOrQty(value);
      if (parsed.unit === 'Pcs' && parsed.value.includes('.')) {
        customError = 'Pcs cannot have decimal values';
      }
    }
    setErrors(prev => {
      const copy = { ...prev };
      if (customError) {
        copy[errKey] = customError;
      } else {
        delete copy[errKey];
      }
      return copy;
    });
  };

  const addItemRow = () => {
    const today = new Date();
    const dateStr = formatDateString(today);
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        { date: dateStr, description: '', weightOrQty: user?.productCategory === 'Bakery' ? '1 kg' : '1', rate: 0, amount: 0 }
      ]
    });
  };

  const removeItemRow = (index: number) => {
    if (invoiceForm.items.length === 1) return;
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, idx) => idx !== index)
    });
  };

  const duplicateItemRow = (index: number) => {
    const itemToDuplicate = invoiceForm.items[index];
    const duplicatedItem = { ...itemToDuplicate };
    const updatedItems = [...invoiceForm.items];
    updatedItems.splice(index + 1, 0, duplicatedItem);
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };
  const handleSelectCatalogItem = (index: number, catalogItem: any) => {
    const updatedItems = [...invoiceForm.items];
    const item = { ...updatedItems[index] };
    
    item.description = catalogItem.name;
    item.rate = catalogItem.rate;
    item.weightOrQty = `1 ${catalogItem.unit || 'Pcs'}`;
    item.amount = catalogItem.rate * 1;

    updatedItems[index] = item;
    setInvoiceForm({ ...invoiceForm, items: updatedItems });

    // Clear any description/rate validation errors for this row
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`item_${index}_description`];
      delete copy[`item_${index}_rate`];
      delete copy[`item_${index}_weightOrQty`];
      return copy;
    });
  };
  // Comprehensive Form Validation Check
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!invoiceForm.invoiceNumber) {
      newErrors.invoiceNumber = 'Invoice number is required';
    } else if (!/^\d+$/.test(invoiceForm.invoiceNumber)) {
      newErrors.invoiceNumber = 'Must be digits only';
    }

    if (!invoiceForm.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    } else if (invoiceForm.customerName.trim().length < 3) {
      newErrors.customerName = 'Name must be at least 3 characters';
    }

    if (invoiceForm.customerPhone && !/^\d{10}$/.test(invoiceForm.customerPhone)) {
      newErrors.customerPhone = 'Must be 10 digits';
    }

    if (!invoiceForm.date) {
      newErrors.date = 'Invoice date is required';
    }

    if (!invoiceForm.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    invoiceForm.items.forEach((item, idx) => {
      if (!item.description.trim()) {
        newErrors[`item_${idx}_description`] = 'Required';
      }
      if (!item.date) {
        newErrors[`item_${idx}_date`] = 'Required';
      }
      if (!item.weightOrQty.trim()) {
        newErrors[`item_${idx}_weightOrQty`] = 'Required';
      } else {
        const parsed = parseWeightOrQty(item.weightOrQty);
        if (parsed.unit === 'Pcs' && parsed.value.includes('.')) {
          newErrors[`item_${idx}_weightOrQty`] = 'Pcs cannot have decimal values';
        }
      }
      if (item.rate <= 0) {
        newErrors[`item_${idx}_rate`] = 'Rate > 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save to DB
  const saveInvoice = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Auto-save new customer contact if checked
      if (customerMode === 'new' && saveToContacts && invoiceForm.customerName.trim()) {
        try {
          await api.post('/customers', {
            name: invoiceForm.customerName,
            phone: invoiceForm.customerPhone,
            address: invoiceForm.customerAddress
          });
        } catch (cErr) {
          console.error('Failed to auto-save customer contact:', cErr);
        }
      }

      if (invoiceId) {
        await api.put(`/invoices/${invoiceId}`, invoiceForm);
      } else {
        await api.post('/invoices', invoiceForm);
      }
      toast.success('Invoice saved successfully');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  // Canvas-based parser to convert any browser-supported CSS color function (like oklch, lab, lch) to standard RGB/RGBA
  const convertColorToRgb = (colorStr: string): string => {
    if (!colorStr) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return colorStr;
    
    try {
      ctx.fillStyle = colorStr;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    } catch (e) {
      return colorStr;
    }
  };

  const convertColorsInString = (str: string): string => {
    if (!str) return '';
    return str.replace(/(oklch|lab|lch)\([^)]+\)/g, (match) => {
      return convertColorToRgb(match);
    });
  };

  // Helper to clone a DOM element with all computed styles copied inline
  const cloneElementWithComputedStyles = (source: HTMLElement): HTMLElement => {
    const clone = source.cloneNode(true) as HTMLElement;
    
    const sourceEls = Array.from(source.querySelectorAll('*'));
    const cloneEls = Array.from(clone.querySelectorAll('*'));
    
    const copyElementStyles = (src: Element, dest: HTMLElement) => {
      const computed = window.getComputedStyle(src);
      for (let i = 0; i < computed.length; i++) {
        const key = computed[i];
        // Skip properties that might interfere with absolute/fixed layout of the root clone element
        if (dest === clone && (key === 'position' || key === 'margin' || key === 'transform' || key === 'left' || key === 'top' || key === 'z-index')) {
          continue;
        }
        let val = computed.getPropertyValue(key);
        if (val && (val.includes('oklch') || val.includes('lab') || val.includes('lch'))) {
          val = convertColorsInString(val);
        }
        dest.style.setProperty(key, val, computed.getPropertyPriority(key));
      }
    };
    
    copyElementStyles(source, clone);
    
    sourceEls.forEach((srcEl, idx) => {
      const cloneEl = cloneEls[idx] as HTMLElement;
      if (cloneEl) {
        copyElementStyles(srcEl, cloneEl);
      }
    });
    
    clone.style.position = 'relative';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.top = '0';
    clone.style.left = '0';
    
    return clone;
  };

  // PDF Download Action
const downloadPDF = async () => {
  const printArea = document.getElementById('invoice-print-area') || printRef.current;
  if (!printArea) {
    toast.error('Invoice print area not found');
    return;
  }

  const isThermal = invoiceForm.templateId === 'thermal';
  const printAreaWidth = isThermal ? 320 : 800;

  const tempContainer = document.createElement('div');
  tempContainer.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: ${printAreaWidth}px; z-index: -99999;
    overflow: hidden; background: #ffffff;
  `;

  try {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const clonedElement = cloneElementWithComputedStyles(printArea as HTMLElement);
    clonedElement.style.width = `${printAreaWidth}px`;
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Wait for layout to settle so getBoundingClientRect is accurate on the CLONE
    await new Promise((resolve) => setTimeout(resolve, 200));

    const printAreaHeight = clonedElement.scrollHeight;
    tempContainer.style.height = `${printAreaHeight}px`;

    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: printAreaWidth,
      height: printAreaHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (isThermal) {
      // 80mm width. Height is scaled to fit content.
      const pdfWidth = 80;
      const pdfHeight = (printAreaHeight / printAreaWidth) * pdfWidth;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Receipt_${invoiceForm.invoiceNumber}.pdf`);
    } else {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Measure rows from the CLONED element (already in DOM with settled layout)
      const cloneRect = clonedElement.getBoundingClientRect();
      const rows = Array.from(clonedElement.querySelectorAll('tbody tr')) as HTMLElement[];
      const rowPositions = rows.map(row => {
        const rect = row.getBoundingClientRect();
        return {
          top: rect.top - cloneRect.top,
          bottom: rect.bottom - cloneRect.top,
        };
      });

      // Page height calculations in px (based on fixed 800px width)
      const pageHeightPx = (297 / 210) * printAreaWidth;   // ~1131px
      const headerHeightPx = (15 / 297) * pageHeightPx;    // ~57px
      const footerHeightPx = (15 / 297) * pageHeightPx;    // ~57px
      const ROW_BUFFER = 4; // px buffer to avoid clipping row borders

      const findSafeCut = (idealCut: number): number => {
        for (const r of rowPositions) {
          // If a row straddles the cut point (with buffer), move cut up to row top
          if (r.top < idealCut - ROW_BUFFER && r.bottom > idealCut - ROW_BUFFER) {
            return r.top;
          }
        }
        return idealCut;
      };

      const pageRanges: { start: number; end: number; drawY: number }[] = [];
      let currentY = 0;

      // Page 1: full page minus footer
      const page1Ideal = pageHeightPx - footerHeightPx;
      const page1End = Math.min(findSafeCut(page1Ideal), printAreaHeight);
      pageRanges.push({ start: 0, end: page1End, drawY: 0 });
      currentY = page1End;

      // Subsequent pages: minus header and footer
      const bodyHeightPx = pageHeightPx - headerHeightPx - footerHeightPx;
      while (currentY < printAreaHeight) {
        const idealEnd = currentY + bodyHeightPx;
        const safeCut = findSafeCut(Math.min(idealEnd, printAreaHeight));
        // Guard against infinite loop if a single row is taller than a page
        const nextEnd = safeCut > currentY ? safeCut : currentY + bodyHeightPx;
        pageRanges.push({ start: currentY, end: Math.min(nextEnd, printAreaHeight), drawY: headerHeightPx });
        currentY = Math.min(nextEnd, printAreaHeight);
      }

      const totalPages = pageRanges.length;
      const pxToMm = pdfWidth / printAreaWidth;
      const imgHeight = (printAreaHeight / printAreaWidth) * pdfWidth;

      pageRanges.forEach((page, idx) => {
        const pageNum = idx + 1;

        // Draw the full image shifted so only this page's slice is visible
        const canvasStartMm = page.start * pxToMm;
        const drawYMm = page.drawY * pxToMm;
        pdf.addImage(imgData, 'JPEG', 0, drawYMm - canvasStartMm, pdfWidth, imgHeight, undefined, 'FAST');

        // White header band on pages 2+
        if (pageNum > 1) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, 15, 'F');
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Invoice #${invoiceForm.invoiceNumber}`, 15, 9);
          pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - 15, 9, { align: 'right' });
          pdf.setDrawColor(230, 230, 230);
          pdf.setLineWidth(0.2);
          pdf.line(15, 11, pdfWidth - 15, 11);
        }

        // White footer band — covers everything below the content slice
        const contentEndMm = page.drawY * pxToMm + (page.end - page.start) * pxToMm;
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, contentEndMm, pdfWidth, pdfHeight - contentEndMm, 'F');
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.2);
        pdf.line(15, pdfHeight - 15, pdfWidth - 15, pdfHeight - 15);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth / 2, pdfHeight - 7, { align: 'center' });

        if (pageNum < totalPages) pdf.addPage();
      });

      pdf.save(`Invoice_${invoiceForm.invoiceNumber}_${invoiceForm.customerName.replace(/\s+/g, '_')}.pdf`);
    }
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Failed to generate PDF. Please try again.');
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    setLoading(false);
  }
};

  if (authLoading || !user || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <p className="animate-pulse font-medium">Loading Invoice Builder...</p>
      </div>
    );
  }

  const templateProps = {
    invoice: {
      invoiceNumber: invoiceForm.invoiceNumber,
      customerName: invoiceForm.customerName,
      customerPhone: invoiceForm.customerPhone,
      customerAddress: invoiceForm.customerAddress,
      date: invoiceForm.date,
      dueDate: invoiceForm.dueDate,
      items: invoiceForm.items,
      subtotal,
      taxPercent: invoiceForm.taxPercent,
      taxAmount,
      discountAmount: invoiceForm.discountAmount,
      totalAmount,
      totalAmountInWords,
      terms: invoiceForm.terms
    },
    business: {
      businessName: user.businessName,
      ownerName: user.ownerName,
      phone: user.phone,
      address: user.address,
      logoUrl: user.logoUrl,
      licenseNumber: user.licenseNumber,
      productCategory: user.productCategory
    },
    customization: {
      primaryColor: invoiceForm.templateCustomization.primaryColor,
      secondaryColor: invoiceForm.templateCustomization.secondaryColor,
      fontFamily: invoiceForm.templateCustomization.fontFamily,
      showLogo: invoiceForm.templateCustomization.showLogo,
      showSignature: invoiceForm.templateCustomization.showSignature,
      signatureName: invoiceForm.templateCustomization.signatureName,
      signatureUrl: invoiceForm.templateCustomization.signatureUrl
    }
  };

  const activeErrors = Object.fromEntries(
    Object.entries(errors).filter(([_, val]) => !!val)
  );
  const hasFormErrors = Object.keys(activeErrors).length > 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 h-screen">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight">
              {invoiceId ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">Design and draft billing details dynamically</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button 
            onClick={() => router.push('/dashboard?tab=settings')} 
            variant="outline" 
            className="border-slate-200 text-slate-650 cursor-pointer hover:bg-slate-50 flex items-center shadow-sm text-xs px-2 h-9"
            title="Configure branding, logo, colors, signature and defaults"
          >
            <Settings className="h-4 w-4 md:mr-1.5" /> <span className="hidden md:inline">Settings</span>
          </Button>
          <Button onClick={downloadPDF} variant="outline" className="border-slate-200 text-slate-650 cursor-pointer hover:bg-slate-50 text-xs px-2 h-9">
            <Download className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline cursor-pointer">PDF</span>
          </Button>
          <Button onClick={saveInvoice} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer text-white font-bold transition-all text-xs px-2.5 sm:px-4 h-9">
            <Save className="h-4 w-4 sm:mr-1.5" /> 
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Invoice'}</span>
            <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
          </Button>
        </div>
      </header>

      {/* Workspace split */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* LEFT COLUMN: Controls Form (scrollable) */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 space-y-6 lg:h-full">
          {hasFormErrors && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-xl space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                Please fix the following validation errors:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 mt-1">
                {activeErrors.invoiceNumber && <li>Invoice Number: {activeErrors.invoiceNumber}</li>}
                {activeErrors.customerName && <li>Customer Name: {activeErrors.customerName}</li>}
                {activeErrors.customerPhone && <li>Customer Phone: {activeErrors.customerPhone}</li>}
                {activeErrors.date && <li>Invoice Date: {activeErrors.date}</li>}
                {activeErrors.dueDate && <li>Due Date: {activeErrors.dueDate}</li>}
                {Object.keys(activeErrors).some(k => k.startsWith('item_')) && (
                  <li>Line Items: Ensure all descriptions are filled and unit prices are greater than 0.</li>
                )}
              </ul>
            </div>
          )}

          {/* Invoice & Customer Details Card */}
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
            <CardHeader className="py-5 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <User className="h-4 w-4 text-indigo-550" /> Invoice & Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-slate-705">Invoice Number</Label>
                  <Input 
                    id="invoiceNumber" 
                    name="invoiceNumber" 
                    value={invoiceForm.invoiceNumber}
                    onChange={handleInputChange}
                    className={cn(
                      "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
                      errors.invoiceNumber && "border-rose-450 focus:border-rose-500 focus:ring-rose-500"
                    )} 
                  />
                  {errors.invoiceNumber && (
                    <p className="text-[10px] text-rose-650 font-bold mt-1">{errors.invoiceNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-705">Invoice Status</Label>
                  <Select
                    value={invoiceForm.status}
                    onValueChange={(val) => setInvoiceForm({ ...invoiceForm, status: val as any })}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 hover:border-slate-350 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                  <Label className="text-slate-705">Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center justify-start text-left font-normal bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 h-11 text-sm px-3 w-full cursor-pointer",
                        errors.date && "border-rose-450 focus:border-rose-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-405" />
                      {invoiceForm.date ? invoiceForm.date : <span>Pick Date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDateString(invoiceForm.date)}
                        onSelect={(date) => {
                          if (date) {
                            setInvoiceForm({ ...invoiceForm, date: formatDateString(date) });
                            setErrors(prev => ({ ...prev, date: '' }));
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-[10px] text-rose-655 font-bold">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label className="text-slate-705">Due Date</Label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex items-center justify-start text-left font-normal bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 h-11 text-sm px-3 w-full cursor-pointer",
                        errors.dueDate && "border-rose-450 focus:border-rose-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-405" />
                      {invoiceForm.dueDate ? invoiceForm.dueDate : <span>Pick Date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDateString(invoiceForm.dueDate)}
                        onSelect={(date) => {
                          if (date) {
                            setInvoiceForm({ ...invoiceForm, dueDate: formatDateString(date) });
                            setErrors(prev => ({ ...prev, dueDate: '' }));
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dueDate && (
                    <p className="text-[10px] text-rose-655 font-bold">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* Customer Details Nested Section */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Details</h4>
                  
                  {/* Selector Toggle */}
                  <div className="flex gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-lg w-fit">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      className={cn(
                        "text-[10px] font-bold py-1 px-3 rounded-md transition-all cursor-pointer",
                        customerMode === 'new'
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      New Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('existing');
                        if (selectedCustomerId) {
                          handleCustomerSelect(selectedCustomerId);
                        }
                      }}
                      className={cn(
                        "text-[10px] font-bold py-1 px-3 rounded-md transition-all cursor-pointer",
                        customerMode === 'existing'
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      From Contacts
                    </button>
                  </div>
                </div>

                {/* Dropdown if Select Existing */}
                {customerMode === 'existing' && (
                  <div className="space-y-2 pb-2 border-b border-slate-50 relative">
                    <Label htmlFor="customerSelectSearch" className="text-slate-705">Search / Select Customer Contact</Label>
                    {customers.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-1 bg-slate-50 rounded border border-slate-150 px-3">
                        No customer contacts registered yet. Try choosing "New Customer" to create one.
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Selected value or search input */}
                        <div className="relative">
                          <Input
                            id="customerSelectSearch"
                            placeholder="Type to search saved customers..."
                            value={customerSearchInput}
                            onChange={(e) => {
                              setCustomerSearchInput(e.target.value);
                              setIsOpenDropdown(true);
                            }}
                            onFocus={() => setIsOpenDropdown(true)}
                            className="bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-12 text-sm"
                          />
                          {customerSearchInput || selectedCustomerId ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleCustomerSelect(null);
                              }}
                              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer"
                            >
                              Clear
                            </button>
                          ) : (
                            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          )}
                        </div>

                        {/* Dropdown List */}
                        {isOpenDropdown && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10 cursor-default" 
                              onClick={() => setIsOpenDropdown(false)} 
                            />
                            
                            <div className="absolute left-0 right-0 mt-1 max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                              {(() => {
                                const filtered = customers.filter(c =>
                                  c.name.toLowerCase().includes(customerSearchInput.toLowerCase()) ||
                                  (c.phone && c.phone.includes(customerSearchInput))
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-xs text-slate-400 italic py-3 text-center px-4">
                                      No matching customer contacts found
                                    </div>
                                  );
                                }

                                return filtered.map((c) => (
                                  <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                      handleCustomerSelect(c._id);
                                      setIsOpenDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-indigo-50 hover:text-indigo-650 transition-colors flex justify-between items-center cursor-pointer",
                                      selectedCustomerId === c._id && "bg-indigo-50/50 text-indigo-600 font-bold"
                                    )}
                                  >
                                    <span className="truncate">{c.name}</span>
                                    {c.phone && <span className="text-[10px] text-slate-400 ml-2 font-normal">{c.phone}</span>}
                                  </button>
                                ));
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-slate-705">Customer Name / Bill To</Label>
                  <Input 
                    id="customerName" 
                    name="customerName" 
                    placeholder="Envision Scientific Pvt Ltd"
                    value={invoiceForm.customerName}
                    onChange={handleInputChange}
                    className={cn(
                      "bg-white border-slate-200 text-slate-900 focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500",
                      errors.customerName && "border-rose-450 focus:border-rose-500 focus:ring-rose-500"
                    )} 
                  />
                  {errors.customerName && (
                    <p className="text-[10px] text-rose-650 font-bold mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm font-medium text-slate-700">
                    Customer Phone (Optional)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input 
                      id="customerPhone" 
                      name="customerPhone" 
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={invoiceForm.customerPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only numbers
                        handleInputChange({
                          target: {
                            name: 'customerPhone',
                            value: value
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        "h-11 bg-white border-slate-200 text-slate-900 pl-10 pr-10 focus-visible:border-indigo-500 focus-visible:ring-indigo-500",
                        errors.customerPhone && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-500",
                        invoiceForm.customerPhone && invoiceForm.customerPhone.length === 10 && !errors.customerPhone && "border-emerald-400"
                      )} 
                    />
                    {invoiceForm.customerPhone && invoiceForm.customerPhone.length === 10 && !errors.customerPhone && (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  {errors.customerPhone && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.customerPhone}
                    </p>
                  )}
                  {invoiceForm.customerPhone && invoiceForm.customerPhone.length > 0 && invoiceForm.customerPhone.length !== 10 && !errors.customerPhone && (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Phone number must be 10 digits
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerAddress" className="text-slate-705">Customer Address (Optional)</Label>
                  <textarea 
                    id="customerAddress" 
                    name="customerAddress" 
                    rows={2}
                    placeholder="e.g. Suite 404, Building 3B, Mumbai, MH"
                    value={invoiceForm.customerAddress}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-505"
                  />
                </div>

                {customerMode === 'new' && (
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-100/60 mt-2">
                    <input 
                      id="saveToContacts"
                      type="checkbox"
                      checked={saveToContacts}
                      onChange={(e) => setSaveToContacts(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                    />
                    <Label htmlFor="saveToContacts" className="text-xs text-slate-550 cursor-pointer select-none">
                      Save this customer to my contacts list
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items builder */}
          <Card className="bg-white border-slate-200 text-slate-900 shadow-sm pt-0">
            <CardHeader className="flex flex-row justify-between items-center py-5 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Plus className="h-4 w-4 text-emerald-600" /> Invoice Line Items
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addItemRow} className="border-slate-200 text-slate-650 hover:bg-slate-50">
                Add Row
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoiceForm.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
                  {/* Item block header */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 mb-2">
                    <span className="text-xs font-bold text-slate-600 bg-slate-150 px-2 py-0.5 rounded">
                      Item #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => duplicateItemRow(idx)} 
                        className="h-7 w-7 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 cursor-pointer"
                        title="Duplicate Row"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        disabled={invoiceForm.items.length === 1}
                        onClick={() => removeItemRow(idx)} 
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Order Date Picker */}
                    <div className="col-span-1 space-y-1 flex flex-col">
                      <Label className="text-[10px] text-slate-500 font-semibold">Order Date</Label>
                      <Popover>
                        <PopoverTrigger
                          className={cn(
                            "flex items-center justify-start text-left font-normal bg-white border border-slate-200 rounded-lg text-xs h-9 text-slate-900 px-2.5 w-full cursor-pointer hover:bg-slate-50 transition-colors",
                            activeErrors[`item_${idx}_date`] && "border-rose-450 focus:border-rose-500"
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                          {item.date ? item.date : <span className="text-slate-400">Pick Date</span>}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateString(item.date)}
                            onSelect={(date) => {
                              if (date) {
                                handleItemChange(idx, 'date', formatDateString(date));
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {activeErrors[`item_${idx}_date`] && (
                        <p className="text-[10px] text-rose-650 font-bold">{activeErrors[`item_${idx}_date`]}</p>
                      )}
                    </div>
                    
                    <div className="col-span-2 sm:col-span-2 space-y-1 relative">
                      <Label className="text-[10px] text-slate-500 font-semibold">Item Description</Label>
                      <div className="relative">
                        <Input 
                          value={item.description} 
                          placeholder="e.g. Chocolate Choco Chips"
                          onChange={(e) => {
                            handleItemChange(idx, 'description', e.target.value);
                            setActiveItemDropdownIndex(idx);
                          }}
                          onFocus={() => setActiveItemDropdownIndex(idx)}
                          className={cn(
                            "bg-white border-slate-200 text-xs h-9 text-slate-900",
                            activeErrors[`item_${idx}_description`] && "border-rose-450 focus:border-rose-500"
                          )} 
                        />
                        
                        {/* Autocomplete Dropdown */}
                        {activeItemDropdownIndex === idx && itemsCatalog.length > 0 && (
                          <>
                            {/* Backdrop to close on click outside */}
                            <div 
                              className="fixed inset-0 z-10 cursor-default" 
                              onClick={() => setActiveItemDropdownIndex(null)}
                            />
                            <div className="absolute left-0 right-0 mt-1 max-h-[160px] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                              {(() => {
                                const search = item.description.toLowerCase();
                                const filtered = itemsCatalog.filter(catalogItem => 
                                  catalogItem.name.toLowerCase().includes(search)
                                );

                                if (filtered.length === 0) {
                                  if (search === '') {
                                    // If empty, show all items
                                    return itemsCatalog.map((catalogItem) => (
                                      <button
                                        key={catalogItem._id}
                                        type="button"
                                        onClick={() => {
                                          handleSelectCatalogItem(idx, catalogItem);
                                          setActiveItemDropdownIndex(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-indigo-50 hover:text-indigo-650 transition-colors flex justify-between items-center cursor-pointer"
                                      >
                                        <span className="truncate font-medium">{catalogItem.name}</span>
                                        <span className="text-[10px] text-slate-400 font-normal ml-2">₹{catalogItem.rate}/{catalogItem.unit}</span>
                                      </button>
                                    ));
                                  }
                                  return (
                                    <div className="text-[10px] text-slate-400 italic py-2 text-center px-3">
                                      No items match "{item.description}"
                                    </div>
                                  );
                                }

                                return filtered.map((catalogItem) => (
                                  <button
                                    key={catalogItem._id}
                                    type="button"
                                    onClick={() => {
                                      handleSelectCatalogItem(idx, catalogItem);
                                      setActiveItemDropdownIndex(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-indigo-50 hover:text-indigo-650 transition-colors flex justify-between items-center cursor-pointer"
                                  >
                                    <span className="truncate font-medium">{catalogItem.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-2">₹{catalogItem.rate}/{catalogItem.unit}</span>
                                  </button>
                                ));
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold">Qty / Weight</Label>
                      <div className="flex space-x-1">
                        <Input 
                          type="number"
                          step={parseWeightOrQty(item.weightOrQty).unit === 'Pcs' ? '1' : 'any'}
                          value={parseWeightOrQty(item.weightOrQty).value} 
                          placeholder="1"
                          onChange={(e) => {
                            const parsed = parseWeightOrQty(item.weightOrQty);
                            let newValue = e.target.value;
                            if (parsed.unit === 'Pcs') {
                              newValue = newValue.replace(/[^\d]/g, '');
                            }
                            handleItemChange(idx, 'weightOrQty', newValue ? `${newValue} ${parsed.unit}` : '');
                          }}
                          className={cn(
                            "bg-white border-slate-200 text-xs h-9 text-slate-900 w-[60%] focus:border-indigo-505",
                            activeErrors[`item_${idx}_weightOrQty`] && "border-rose-450 focus:border-rose-500"
                          )} 
                        />
                        <Select
                          value={parseWeightOrQty(item.weightOrQty).unit}
                          onValueChange={(val) => {
                            const parsed = parseWeightOrQty(item.weightOrQty);
                            let qtyValue = parsed.value;
                            if (val === 'Pcs') {
                              qtyValue = qtyValue.split('.')[0].replace(/[^\d]/g, '');
                            }
                            handleItemChange(idx, 'weightOrQty', `${qtyValue || '1'} ${val}`);
                          }}
                        >
                          <SelectTrigger className="bg-white border-slate-205 text-slate-900 text-[10px] h-9 w-[40%] hover:border-slate-350 transition-colors px-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="Pcs">PCS</SelectItem>
                            <SelectItem value="kg">KG</SelectItem>
                            <SelectItem value="gm">GM</SelectItem>
                            <SelectItem value="liter">L</SelectItem>
                            <SelectItem value="ml">ML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {activeErrors[`item_${idx}_weightOrQty`] && (
                        <p className="text-[10px] text-rose-650 font-bold">{activeErrors[`item_${idx}_weightOrQty`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold">Unit Price / Rate (₹)</Label>
                      <Input 
                        type="number" 
                        value={item.rate || ''} 
                        placeholder="e.g. 1900"
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className={cn(
                          "bg-white border-slate-200 text-xs h-9 text-slate-900",
                          activeErrors[`item_${idx}_rate`] && "border-rose-450 focus:border-rose-500"
                        )} 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold">Total Price (Calculated)</Label>
                      <div className="bg-white border border-slate-200 rounded-lg text-xs h-9 flex items-center px-3 font-extrabold text-indigo-605">
                        ₹ {item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Tax & Discount section */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxPercent" className="text-slate-700">GST / Tax Percent (%)</Label>
                  <Input 
                    id="taxPercent" 
                    type="number" 
                    value={invoiceForm.taxPercent || ''}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxPercent: Number(e.target.value) || 0 })}
                    className="bg-white border-slate-200 text-slate-900" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountAmount" className="text-slate-700">Discount Amount (₹)</Label>
                  <Input 
                    id="discountAmount" 
                    type="number" 
                    value={invoiceForm.discountAmount || ''}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: Number(e.target.value) || 0 })}
                    className="bg-white border-slate-200 text-slate-900" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Preview Container */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 bg-slate-100 lg:overflow-y-auto lg:h-full flex items-start justify-center shadow-inner sticky top-0 scale">
          <div className="w-full max-w-[800px]">
            <div className="flex justify-between items-center mb-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> 
                {invoiceForm.templateId === 'thermal' ? 'POS Receipt Preview' : 'A4 Print Preview'}
              </span>
              <span className="bg-white border border-slate-200 px-2.5 py-0.5 rounded text-[10px] text-slate-600 uppercase tracking-widest">{invoiceForm.templateId}</span>
            </div>

            {/* Renderable wrapper for PDF generation */}
            <div className="w-full overflow-x-auto flex justify-start xl:justify-center p-1">
              <div 
                ref={printRef} 
                className={cn(
                  "overflow-hidden rounded-xl shadow-xl bg-white border border-slate-200",
                  invoiceForm.templateId === 'thermal' ? "w-75" : "min-w-150 xl:min-w-full"
                )}
              >
                {invoiceForm.templateId === 'classic' && (
                  <ClassicTemplate {...templateProps} />
                )}
                {invoiceForm.templateId === 'modern' && (
                  <ModernTemplate {...templateProps} />
                )}
                {invoiceForm.templateId === 'elegant' && (
                  <ElegantTemplate {...templateProps} />
                )}
                {invoiceForm.templateId === 'thermal' && (
                  <ThermalTemplate {...templateProps} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirm / Alert Dialog */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

export default function InvoiceEditor() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <p className="animate-pulse font-medium">Loading Invoice Builder...</p>
      </div>
    }>
      <InvoiceEditorContent />
    </Suspense>
  );
}
