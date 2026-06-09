import React from 'react';

export interface InvoiceItem {
  date: string;
  description: string;
  weightOrQty: string;
  rate: number;
  amount: number;
}

export interface TemplateProps {
  invoice: {
    invoiceNumber: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    date: string;
    dueDate?: string;
    items: InvoiceItem[];
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    totalAmountInWords: string;
    terms?: string;
  };
  business: {
    businessName: string;
    ownerName: string;
    phone: string;
    address: string;
    logoUrl?: string;
    licenseNumber?: string;
    productCategory: string;
  };
  customization: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    showLogo: boolean;
    showSignature: boolean;
    signatureName?: string;
    signatureUrl?: string;
  };
}

export const ClassicTemplate: React.FC<TemplateProps> = ({ invoice, business, customization }) => {
  const primaryColor = customization.primaryColor || '#b91c1c'; // Cakespot red
  const fontClass = customization.fontFamily === 'Lora' ? 'font-serif' : customization.fontFamily === 'Playfair Display' ? 'font-serif' : 'font-sans';

  return (
    <div 
      className={`bg-white text-slate-800 p-8 shadow-inner border border-slate-200 mx-auto w-full max-w-[800px] min-h-[1050px] flex flex-col justify-between ${fontClass}`}
      id="invoice-print-area"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Section */}
      <div>
        {/* Header Branding */}
        <div className="flex justify-between items-start pb-4 gap-3">
          {customization.showLogo && business.logoUrl && (
            <div className="">
              <img 
                src={business.logoUrl} 
                alt="Business Logo" 
                className="h-24 w-24 object-contain rounded border border-slate-100 bg-white"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight break-words" style={{ color: primaryColor }}>
              {business.businessName}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-[450px] whitespace-pre-line leading-relaxed">
              {business.address}
            </p>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              Mobile: {business.phone}
            </p>
            {/* {business.licenseNumber && (
              <p className="text-xs text-slate-500 mt-0.5">
                GSTIN: <span className="font-semibold">{business.licenseNumber}</span>
              </p>
            )} */}
          </div>
        </div>

        {/* Thick Colored Bar Divider */}
        <div className="h-1.5 w-full mb-4" style={{ backgroundColor: primaryColor }} />

        {/* Invoice Meta Banner */}
        <div className="bg-slate-100 grid grid-cols-3 gap-2 px-4 py-2.5 rounded text-xs font-semibold text-slate-700 mb-6">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Invoice No.</span>
            <span className="text-slate-800 font-bold">{invoice.invoiceNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Invoice Date</span>
            <span className="text-slate-800 font-bold">{invoice.date}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Due Date</span>
            <span className="text-slate-800 font-bold">{invoice.dueDate || 'N/A'}</span>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">BILL TO</h3>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <p className="font-bold text-sm text-slate-800 break-words">{invoice.customerName}</p>
              {invoice.customerAddress && (
                <p className="text-xs text-slate-500 whitespace-pre-line mt-1 max-w-[320px]">
                  {invoice.customerAddress}
                </p>
              )}
            </div>
            {invoice.customerPhone && (
              <p className="text-xs text-slate-600 font-medium">
                Phone: {invoice.customerPhone}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 font-bold text-xs uppercase" style={{ borderColor: primaryColor, color: primaryColor }}>
                <th className="py-2.5 text-[11px] w-[8%]">S.No.</th>
                <th className="py-2.5 text-[11px] w-[15%]">Date</th>
                <th className="py-2.5 text-[11px] w-[40%]">Item Description</th>
                <th className="py-2.5 text-[11px] text-right">
                  Quantity
                </th>
                <th className="py-2.5 text-[11px] text-right">Rate</th>
                <th className="py-2.5 text-[11px] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 text-slate-500">{item.date}</td>
                  <td className="py-2.5 font-bold text-slate-800 break-words whitespace-pre-wrap max-w-[280px]">{item.description}</td>
                  <td className="py-2.5 text-right font-medium">{item.weightOrQty}</td>
                  <td className="py-2.5 text-right">₹{item.rate.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-bold text-slate-900">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section */}
      <div>
        {/* Subtotal Colored Divider */}
        <div className="h-0.5 w-full mb-4" style={{ backgroundColor: primaryColor }} />

        {/* Calculations / Summary */}
        <div className="flex justify-between items-start gap-6 w-full">
          {/* Terms & Conditions */}
          <div className="text-[10px] text-slate-500 max-w-[60%]">
            <h4 className="font-bold text-slate-700 uppercase mb-1.5 tracking-wider">Terms & Conditions</h4>
            {invoice.terms ? (
              <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
            ) : (
              <p>1. Goods once sold will not be taken back or exchanged.<br />2. All disputes are subject to local jurisdiction only.</p>
            )}
          </div>

          {/* Pricing Totals */}
          <div className="text-xs space-y-1.5 w-full max-w-[280px] flex-shrink-0">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            
            {invoice.taxPercent > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>GST / Tax ({invoice.taxPercent}%):</span>
                <span>₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
            )}

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-slate-300 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
              <span>Total Amount:</span>
              <span>₹{invoice.totalAmount.toLocaleString()}</span>
            </div>

            {/* Total In Words */}
            <div className="pt-2 text-[10px] text-slate-500 text-right leading-snug">
              <span className="font-bold text-slate-600 block uppercase text-[9px] mb-0.5">Total Amount in Words</span>
              <span className="italic">{invoice.totalAmountInWords}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature Block */}
        {customization.showSignature && (
          <div className="flex flex-col items-end mt-12 pt-4 border-t border-slate-100">
            <div className="text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                AUTHORISED SIGNATORY FOR {business.businessName.toUpperCase()}
              </span>
              
              {/* Signature image or cursive text fallback */}
              {customization.signatureUrl ? (
                <img
                  src={customization.signatureUrl}
                  alt="Signature"
                  className="h-14 object-contain mx-auto my-1"
                />
              ) : (
                <div className="font-cursive text-2xl text-rose-800 my-1 font-semibold select-none leading-none pr-4">
                  {customization.signatureName || business.ownerName}
                </div>
              )}
              
              <div className="h-0.5 w-48 bg-slate-300 mt-2 mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
