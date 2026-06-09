'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { 
  Search, Trash2, Edit, Download, Eye, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

// Templates
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { ElegantTemplate } from '@/components/templates/ElegantTemplate';
import { ThermalTemplate } from '@/components/templates/ThermalTemplate';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  dueDate?: string;
  items: any[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  totalAmountInWords: string;
  terms: string;
  status: string;
  templateId?: string;
  templateCustomization?: any;
}

function InvoicesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { confirm, dialogProps } = useDialog();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const itemsPerPage = 10;

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.get('/invoices');
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Reset pagination on search change
  useEffect(() => {
    setInvoicePage(1);
  }, [search]);

  const deleteInvoice = async (id: string) => {
    const ok = await confirm(
      'Delete Invoice',
      'Are you sure you want to permanently delete this invoice? This action cannot be undone.',
      'Delete'
    );
    if (ok) {
      try {
        await api.delete(`/invoices/${id}`);
        setInvoices(invoices.filter(inv => inv._id !== id));
        toast.success('Invoice deleted successfully');
      } catch (err) {
        toast.error('Failed to delete the invoice. Please try again.');
      }
    }
  };

  const toggleInvoiceStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
      setInvoices(prev => prev.map(inv => inv._id === id ? { ...inv, status: newStatus } : inv));
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update invoice status.');
    }
  };

  // View modal state
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const openViewModal = async (id: string) => {
    try {
      setViewLoading(true);
      const data = await api.get(`/invoices/${id}`);
      setViewingInvoice(data);
    } catch {
      toast.error('Failed to load the invoice. Please try again.');
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => setViewingInvoice(null);

  // PDF download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [invoiceToDownload, setInvoiceToDownload] = useState<any | null>(null);

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
    } catch {
      return colorStr;
    }
  };

  const convertColorsInString = (str: string): string => {
    if (!str) return '';
    return str.replace(/(oklch|lab|lch)\([^)]+\)/g, (match) => {
      return convertColorToRgb(match);
    });
  };

  const cloneElementWithComputedStyles = (source: HTMLElement): HTMLElement => {
    const clone = source.cloneNode(true) as HTMLElement;
    const sourceEls = Array.from(source.querySelectorAll('*'));
    const cloneEls = Array.from(clone.querySelectorAll('*'));

    const copyElementStyles = (src: Element, dest: HTMLElement) => {
      const computed = window.getComputedStyle(src);
      for (let i = 0; i < computed.length; i++) {
        const key = computed[i];
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

  const downloadInvoicePDF = async (invoiceData: any) => {
    try {
      setDownloadingId(invoiceData._id);
      
      let fullInvoice = invoiceData;
      if (!invoiceData.items || invoiceData.items.length === 0) {
        fullInvoice = await api.get(`/invoices/${invoiceData._id}`);
      }

      setInvoiceToDownload(fullInvoice);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const printArea = document.getElementById('invoices-print-area');
      if (!printArea) {
        toast.error('Download container not found.');
        return;
      }

      const isThermal = fullInvoice.templateId === 'thermal';
      const printAreaWidth = isThermal ? 320 : 800;

      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: ${printAreaWidth}px; z-index: -99999;
        overflow: hidden; background: #ffffff;
      `;

      const clonedElement = cloneElementWithComputedStyles(printArea);
      clonedElement.style.width = `${printAreaWidth}px`;
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

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
        const pdfWidth = 80;
        const pdfHeight = (printAreaHeight / printAreaWidth) * pdfWidth;
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
          compress: true
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`Receipt_${fullInvoice.invoiceNumber}.pdf`);
      } else {
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        const pdfWidth = 210;
        const pdfHeight = 297;

        const cloneRect = clonedElement.getBoundingClientRect();
        const rows = Array.from(clonedElement.querySelectorAll('tbody tr')) as HTMLElement[];
        const rowPositions = rows.map(row => {
          const rect = row.getBoundingClientRect();
          return {
            top: rect.top - cloneRect.top,
            bottom: rect.bottom - cloneRect.top,
          };
        });

        const pageHeightPx = (297 / 210) * printAreaWidth;
        const headerHeightPx = (15 / 297) * pageHeightPx;
        const footerHeightPx = (15 / 297) * pageHeightPx;
        const ROW_BUFFER = 4;

        const findSafeCut = (idealCut: number): number => {
          for (const r of rowPositions) {
            if (r.top < idealCut - ROW_BUFFER && r.bottom > idealCut - ROW_BUFFER) {
              return r.top;
            }
          }
          return idealCut;
        };

        const pageRanges: { start: number; end: number; drawY: number }[] = [];
        let currentY = 0;

        const page1Ideal = pageHeightPx - footerHeightPx;
        const page1End = Math.min(findSafeCut(page1Ideal), printAreaHeight);
        pageRanges.push({ start: 0, end: page1End, drawY: 0 });
        currentY = page1End;

        const bodyHeightPx = pageHeightPx - headerHeightPx - footerHeightPx;
        while (currentY < printAreaHeight) {
          const idealEnd = currentY + bodyHeightPx;
          const safeCut = findSafeCut(Math.min(idealEnd, printAreaHeight));
          const nextEnd = safeCut > currentY ? safeCut : currentY + bodyHeightPx;
          pageRanges.push({ start: currentY, end: Math.min(nextEnd, printAreaHeight), drawY: headerHeightPx });
          currentY = Math.min(nextEnd, printAreaHeight);
        }

        const totalPages = pageRanges.length;
        const pxToMm = pdfWidth / printAreaWidth;
        const imgHeight = (printAreaHeight / printAreaWidth) * pdfWidth;

        pageRanges.forEach((page, idx) => {
          const pageNum = idx + 1;
          const canvasStartMm = page.start * pxToMm;
          const drawYMm = page.drawY * pxToMm;
          pdf.addImage(imgData, 'JPEG', 0, drawYMm - canvasStartMm, pdfWidth, imgHeight, undefined, 'FAST');

          if (pageNum > 1) {
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, 15, 'F');
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Invoice #${fullInvoice.invoiceNumber}`, 15, 9);
            pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - 15, 9, { align: 'right' });
            pdf.setDrawColor(230, 230, 230);
            pdf.setLineWidth(0.2);
            pdf.line(15, 11, pdfWidth - 15, 11);
          }

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

        pdf.save(`Invoice_${fullInvoice.invoiceNumber}_${fullInvoice.customerName.replace(/\s+/g, '_')}.pdf`);
      }

      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
      setInvoiceToDownload(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (invoicePage - 1) * itemsPerPage,
    invoicePage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg text-slate-900">Billing History</CardTitle>
              <CardDescription className="text-slate-500">Manage all invoices issued by your business.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search customer or invoice..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border-slate-200 text-slate-905 pl-10 focus:border-indigo-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading invoices...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No matching invoices found.</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 border-slate-100">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-slate-700 font-bold py-3.5">Invoice No</TableHead>
                      <TableHead className="text-slate-700 font-bold py-3.5">Customer</TableHead>
                      <TableHead className="text-slate-700 font-bold py-3.5">Date</TableHead>
                      <TableHead className="text-slate-700 font-bold text-right py-3.5">Total Amount</TableHead>
                      <TableHead className="text-slate-700 font-bold py-3.5">Status</TableHead>
                      <TableHead className="text-slate-700 font-bold text-right py-3.5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((inv) => (
                      <TableRow key={inv._id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-800">{inv.invoiceNumber}</TableCell>
                        <TableCell className="font-semibold text-slate-700">{inv.customerName}</TableCell>
                        <TableCell className="text-slate-600">{inv.date}</TableCell>
                        <TableCell className="text-right font-extrabold text-slate-900">₹ {inv.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span 
                            onClick={() => toggleInvoiceStatus(inv._id, inv.status)}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
                              inv.status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => openViewModal(inv._id)}
                              className="h-8 w-8 text-slate-550 hover:text-indigo-650 hover:bg-indigo-50 cursor-pointer"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => downloadInvoicePDF(inv)}
                              disabled={downloadingId === inv._id}
                              className="h-8 w-8 text-slate-550 hover:text-indigo-650 hover:bg-indigo-50 cursor-pointer"
                              title="Download PDF"
                            >
                              {downloadingId === inv._id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-650" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Link href={`/invoices/new?id=${inv._id}`}>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-550 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button size="icon" variant="ghost" onClick={() => deleteInvoice(inv._id)} className="h-8 w-8 text-slate-550 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalInvoicePages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 select-none">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInvoicePage(prev => Math.max(prev - 1, 1))}
                    disabled={invoicePage === 1}
                    className="text-xs h-8 cursor-pointer text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-xs font-semibold text-slate-550">
                    Page {invoicePage} of {totalInvoicePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInvoicePage(prev => Math.min(prev + 1, totalInvoicePages))}
                    disabled={invoicePage === totalInvoicePages}
                    className="text-xs h-8 cursor-pointer text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── View Invoice Modal ────────────────────────────────────────────── */}
      {(viewingInvoice || viewLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
          onClick={closeViewModal}
        >
          <div
            className="relative w-full max-w-[860px] bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Invoice Preview</p>
                {viewingInvoice && (
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    #{viewingInvoice.invoiceNumber} — {viewingInvoice.customerName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {viewingInvoice && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => downloadInvoicePDF(viewingInvoice)}
                      disabled={downloadingId === viewingInvoice._id}
                      className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs h-8 flex items-center font-semibold shadow-sm shadow-indigo-900/10 cursor-pointer"
                    >
                      {downloadingId === viewingInvoice._id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {downloadingId === viewingInvoice._id ? 'Downloading...' : 'Download PDF'}
                    </Button>
                    <Link href={`/invoices/new?id=${viewingInvoice._id}`}>
                      <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-8 flex items-center">
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                      </Button>
                    </Link>
                  </>
                )}
                <button
                  onClick={closeViewModal}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto max-h-[80vh] p-4">
              {viewLoading ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-slate-400 animate-pulse font-medium">Loading invoice…</p>
                </div>
              ) : viewingInvoice ? (
                <div className="w-full overflow-x-auto animate-in fade-in duration-200">
                  <div className="scale-[0.92] origin-top min-w-[800px] mb-8">
                    {(() => {
                      const templateId = viewingInvoice.templateId || 'classic';
                      const tc = viewingInvoice.templateCustomization || {};
                      const customization = {
                        primaryColor: tc.primaryColor || user?.templateSettings?.primaryColor || '#b91c1c',
                        secondaryColor: tc.secondaryColor || '#1f2937',
                        fontFamily: tc.fontFamily || 'Inter',
                        showLogo: tc.showLogo !== false,
                        showSignature: tc.showSignature !== false,
                        signatureName: tc.signatureName || user?.ownerName || '',
                        signatureUrl: user?.templateSettings?.signatureUrl || ''
                      };
                      const invoiceData = {
                        invoiceNumber: viewingInvoice.invoiceNumber,
                        customerName: viewingInvoice.customerName,
                        customerPhone: viewingInvoice.customerPhone || '',
                        date: viewingInvoice.date,
                        dueDate: viewingInvoice.dueDate || '',
                        items: viewingInvoice.items || [],
                        subtotal: viewingInvoice.subtotal || 0,
                        taxPercent: viewingInvoice.taxPercent || 0,
                        taxAmount: viewingInvoice.taxAmount || 0,
                        discountAmount: viewingInvoice.discountAmount || 0,
                        totalAmount: viewingInvoice.totalAmount || 0,
                        totalAmountInWords: viewingInvoice.totalAmountInWords || '',
                        terms: viewingInvoice.terms || ''
                      };
                      const businessData = {
                        businessName: user?.businessName || '',
                        ownerName: user?.ownerName || '',
                        phone: user?.phone || '',
                        address: user?.address || '',
                        logoUrl: user?.logoUrl || '',
                        licenseNumber: user?.licenseNumber || '',
                        productCategory: user?.productCategory || ''
                      };
                      if (templateId === 'modern') {
                        return <ModernTemplate invoice={invoiceData} business={businessData} customization={customization} />;
                      } else if (templateId === 'elegant') {
                        return <ElegantTemplate invoice={invoiceData} business={businessData} customization={customization} />;
                      } else if (templateId === 'thermal') {
                        return <ThermalTemplate invoice={invoiceData} business={businessData} customization={customization} />;
                      }
                      return <ClassicTemplate invoice={invoiceData} business={businessData} customization={customization} />;
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Print Container for Downloading PDF */}
      {invoiceToDownload && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
          <div id="invoices-print-area">
            {(() => {
              const templateId = invoiceToDownload.templateId || 'classic';
              const tc = invoiceToDownload.templateCustomization || {};
              const customization = {
                primaryColor: tc.primaryColor || user?.templateSettings?.primaryColor || '#b91c1c',
                secondaryColor: tc.secondaryColor || '#1f2937',
                fontFamily: tc.fontFamily || 'Inter',
                showLogo: tc.showLogo !== false,
                showSignature: tc.showSignature !== false,
                signatureName: tc.signatureName || user?.ownerName || '',
                signatureUrl: user?.templateSettings?.signatureUrl || ''
              };
              const invoiceData = {
                invoiceNumber: invoiceToDownload.invoiceNumber,
                customerName: invoiceToDownload.customerName,
                customerPhone: invoiceToDownload.customerPhone || '',
                date: invoiceToDownload.date,
                dueDate: invoiceToDownload.dueDate || '',
                items: invoiceToDownload.items || [],
                subtotal: invoiceToDownload.subtotal || 0,
                taxPercent: invoiceToDownload.taxPercent || 0,
                taxAmount: invoiceToDownload.taxAmount || 0,
                discountAmount: invoiceToDownload.discountAmount || 0,
                totalAmount: invoiceToDownload.totalAmount || 0,
                totalAmountInWords: invoiceToDownload.totalAmountInWords || '',
                terms: invoiceToDownload.terms || ''
              };
              const businessData = {
                businessName: user?.businessName || '',
                ownerName: user?.ownerName || '',
                phone: user?.phone || '',
                address: user?.address || '',
                logoUrl: user?.logoUrl || '',
                licenseNumber: user?.licenseNumber || '',
                productCategory: user?.productCategory || ''
              };
              if (templateId === 'modern') {
                return <ModernTemplate invoice={invoiceData} business={businessData} customization={customization} />;
              } else if (templateId === 'elegant') {
                return <ElegantTemplate invoice={invoiceData} business={businessData} customization={customization} />;
              } else if (templateId === 'thermal') {
                return <ThermalTemplate invoice={invoiceData} business={businessData} customization={customization} />;
              }
              return <ClassicTemplate invoice={invoiceData} business={businessData} customization={customization} />;
            })()}
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <p className="animate-pulse font-medium text-slate-500">Loading Billing History...</p>
      </div>
    }>
      <InvoicesPageContent />
    </Suspense>
  );
}
