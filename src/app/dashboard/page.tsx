'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { 
  IndianRupee, FileCheck, Clock, Store, Eye, Download, Edit, Trash2, Loader2, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

// Templates
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { ElegantTemplate } from '@/components/templates/ElegantTemplate';
import { ThermalTemplate } from '@/components/templates/ThermalTemplate';

interface InvoiceSummary {
  totalInvoices: number;
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
}

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

function DashboardOverviewContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { confirm, dialogProps } = useDialog();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [analytics, setAnalytics] = useState<{
    summary: InvoiceSummary;
    revenueOverTime: { date: string; revenue: number }[];
    topItems: { name: string; quantity: number; revenue: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // View modal state
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // PDF download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [invoiceToDownload, setInvoiceToDownload] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invoicesData = await api.get('/invoices');
      setInvoices(invoicesData);

      const analyticsData = await api.get('/invoices/analytics');
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
      toast.error('Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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
        // Refresh analytics
        const analyticsData = await api.get('/invoices/analytics');
        setAnalytics(analyticsData);
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
      // Refresh analytics
      const analyticsData = await api.get('/invoices/analytics');
      setAnalytics(analyticsData);
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update invoice status.');
    }
  };

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

      const printArea = document.getElementById('overview-print-area');
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

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-205 hover:shadow-xl hover:shadow-indigo-900/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">
                  ₹ {analytics?.summary.totalRevenue.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 transition-transform duration-300 hover:scale-110">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-205 hover:shadow-xl hover:shadow-emerald-900/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoices Issued</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">
                  {analytics?.summary.totalInvoices || '0'}
                </h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 transition-transform duration-300 hover:scale-110">
                <FileCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-amber-205 hover:shadow-xl hover:shadow-amber-900/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unpaid Amount</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600">
                  ₹ {analytics?.summary.totalUnpaid.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600 transition-transform duration-300 hover:scale-110">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-teal-205 hover:shadow-xl hover:shadow-teal-900/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category & Type</p>
                <h3 className="text-lg font-bold mt-1 text-slate-900 truncate max-w-[150px]">
                  {user?.productCategory || 'N/A'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">{user?.businessType || 'N/A'}</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-xl text-teal-600 transition-transform duration-300 hover:scale-110">
                <Store className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphs & Sales Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="bg-white border-slate-200 text-slate-900 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Revenue Over Time</CardTitle>
            <CardDescription className="text-slate-500">Daily/Monthly sales chart based on invoices generated.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {analytics && analytics.revenueOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueOverTime}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={(v) => [`₹${v}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Generate your first invoice to view analytics!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Top Products</CardTitle>
            <CardDescription className="text-slate-500">Your shop's highest revenue generating products.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analytics && analytics.topItems.length > 0 ? (
              analytics.topItems.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm truncate max-w-[150px] text-slate-800">{item.name}</span>
                    <span className="text-xs text-indigo-650 font-bold">₹ {item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-450">
                    <span>Qty Sold: {item.quantity} {user?.productCategory === 'Bakery' ? 'kg' : 'pcs'}</span>
                    <span>{Math.round((item.revenue / (analytics.summary.totalRevenue || 1)) * 100)}% of sales</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-650 rounded-full transition-all duration-500" 
                      style={{ width: `${(item.revenue / (analytics.summary.totalRevenue || 1)) * 105}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No products recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Invoice overview */}
      <Card className="bg-white border-slate-200 text-slate-905 shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg text-slate-900">Recent Invoices</CardTitle>
            <CardDescription className="text-slate-500">List of last 5 invoices created.</CardDescription>
          </div>
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 text-xs text-slate-650 cursor-pointer flex items-center gap-1.5">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading recent invoices...</p>
          ) : invoices.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No invoices created yet. Create one now!</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-slate-705 font-bold py-3.5">Invoice No</TableHead>
                    <TableHead className="text-slate-705 font-bold py-3.5">Customer</TableHead>
                    <TableHead className="text-slate-705 font-bold py-3.5">Date</TableHead>
                    <TableHead className="text-slate-705 font-bold text-right py-3.5">Total Amount</TableHead>
                    <TableHead className="text-slate-705 font-bold py-3.5">Status</TableHead>
                    <TableHead className="text-slate-705 font-bold text-right py-3.5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 5).map((inv) => (
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
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => downloadInvoicePDF(inv)}
                            disabled={downloadingId === inv._id}
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Download PDF"
                          >
                            {downloadingId === inv._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-650" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/invoices/new?id=${inv._id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="icon" variant="ghost" onClick={() => deleteInvoice(inv._id)} className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          <div id="overview-print-area">
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

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <p className="animate-pulse font-medium text-slate-500">Loading Dashboard...</p>
      </div>
    }>
      <DashboardOverviewContent />
    </Suspense>
  );
}
