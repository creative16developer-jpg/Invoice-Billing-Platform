import React from 'react';

interface InvoiceItem {
  date: string;
  description: string;
  weightOrQty: string;
  rate: number;
  amount: number;
}

interface TemplateProps {
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

export const ModernTemplate: React.FC<TemplateProps> = ({ invoice, business, customization }) => {
  const primaryColor = customization.primaryColor || '#2563eb'; // Default royal blue
  const fontClass = customization.fontFamily === 'Lora' ? 'font-serif' : customization.fontFamily === 'Playfair Display' ? 'font-serif' : 'font-sans';

  return (
    <div 
      className={`bg-white text-slate-800 p-10 shadow-inner border border-slate-200 mx-auto w-full max-w-[800px] min-h-[1050px] flex flex-col justify-between ${fontClass}`}
      id="invoice-print-area"
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* Header Branding */}
        <div className="flex justify-between items-center pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryColor }} />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 break-words">
                {business.businessName}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[350px]">
              {business.address}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Ph: {business.phone}
            </p>
          </div>
          
          <div className="text-right">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-400">INVOICE</h2>
            <p className="text-sm font-bold text-slate-800 mt-1">#{invoice.invoiceNumber}</p>
            {business.licenseNumber && (
              <p className="text-[10px] text-slate-400 mt-1">
                GSTIN/ID: <span className="font-semibold">{business.licenseNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Invoice Meta and Bill-to Section */}
        <div className="grid grid-cols-2 gap-8 py-8 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider mb-2">Invoice Details</span>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between max-w-[200px]">
                <span className="text-slate-400">Date Issued:</span>
                <span className="font-semibold">{invoice.date}</span>
              </div>
              <div className="flex justify-between max-w-[200px]">
                <span className="text-slate-400">Payment Due:</span>
                <span className="font-semibold">{invoice.dueDate || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-550/5 border border-slate-200 rounded-lg p-3">
            <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider mb-1.5">Billed To</span>
            <div className="text-slate-700 space-y-1">
              <p className="font-bold text-slate-900 break-words">{invoice.customerName}</p>
              {invoice.customerAddress && (
                <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                  {invoice.customerAddress}
                </p>
              )}
              {invoice.customerPhone && (
                <p className="text-[11px] font-medium text-slate-600">Ph: {invoice.customerPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-8">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-200">
                <th className="pb-3 text-left w-[8%]">S.No.</th>
                <th className="pb-3 text-left w-[15%]">Date</th>
                <th className="pb-3 text-left w-[45%]">Item Description</th>
                <th className="pb-3 text-right">
                  {business.productCategory === 'Bakery' ? 'Weight' : 'Qty'}
                </th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-550/10">
                  <td className="py-3 text-slate-500">{idx + 1}</td>
                  <td className="py-3 text-slate-500">{item.date}</td>
                  <td className="py-3 font-semibold text-slate-800 break-words whitespace-pre-wrap max-w-[280px]">{item.description}</td>
                  <td className="py-3 text-right">{item.weightOrQty}</td>
                  <td className="py-3 text-right">₹{item.rate.toLocaleString()}</td>
                  <td className="py-3 text-right font-bold text-slate-900">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary / Calculation / Signature */}
      <div className="border-t border-slate-100 pt-8">
        <div className="flex justify-between items-start gap-8 w-full">
          <div className="space-y-4 max-w-[60%]">
            {/* Notes */}
            <div className="text-[10px] text-slate-400">
              <h4 className="font-bold text-slate-600 uppercase mb-1 tracking-wider">Terms & Notes</h4>
              <p className="whitespace-pre-line leading-relaxed">{invoice.terms || 'Standard terms apply.'}</p>
            </div>
            
            {/* In Words */}
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="font-bold text-slate-500 block uppercase text-[9px] mb-0.5">Amount In Words</span>
              <span className="italic font-medium text-slate-600">{invoice.totalAmountInWords}</span>
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="text-xs space-y-2 w-full max-w-[280px] flex-shrink-0">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            
            {invoice.taxPercent > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({invoice.taxPercent}%):</span>
                <span className="font-semibold text-slate-800">₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
            )}

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Discount:</span>
                <span className="font-semibold">-₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-sm text-slate-900">
              <span>Total Due:</span>
              <span style={{ color: primaryColor }}>₹{invoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        {customization.showSignature && (
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100 text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider">THANK YOU FOR YOUR BUSINESS!</span>
            <div className="text-center pr-4">
              {customization.signatureUrl ? (
                <img
                  src={customization.signatureUrl}
                  alt="Signature"
                  className="h-14 object-contain mx-auto my-1"
                />
              ) : (
                <div className="font-cursive text-xl text-slate-700 my-1 font-semibold">
                  {customization.signatureName || business.ownerName}
                </div>
              )}
              <div className="h-px w-32 bg-slate-200 mx-auto mt-1" />
              <span className="text-[8px] font-bold uppercase tracking-wider block mt-1">Authorized Representative</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
