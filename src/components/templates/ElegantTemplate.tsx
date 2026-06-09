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

export const ElegantTemplate: React.FC<TemplateProps> = ({ invoice, business, customization }) => {
  const primaryColor = customization.primaryColor || '#78350f'; // Warm Amber/Gold/Bronze tone
  const fontClass = 'font-serif'; // Always serif for elegant template

  return (
    <div 
      className={`bg-[#fdfcf7] text-[#332a1e] p-12 shadow-inner border-[3px] border-double mx-auto w-full max-w-[800px] min-h-[1050px] flex flex-col justify-between ${fontClass}`}
      id="invoice-print-area"
      style={{ borderColor: primaryColor, boxSizing: 'border-box' }}
    >
      <div>
        {/* Centered Business Header */}
        <div className="text-center pb-6 border-b border-[#ebdcb9]">
          {customization.showLogo && business.logoUrl && (
            <div className="mb-3 flex justify-center">
              <img 
                src={business.logoUrl} 
                alt="Logo" 
                className="h-14 w-14 object-contain rounded-full border border-[#ebdcb9] bg-white p-0.5"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-wide uppercase break-words" style={{ color: primaryColor }}>
            {business.businessName}
          </h1>
          <p className="text-xs italic text-[#70644e] mt-1 max-w-[500px] mx-auto leading-relaxed">
            {business.address}
          </p>
          <div className="flex justify-center space-x-4 text-xs text-[#5c503b] mt-2 font-medium">
            <span>Phone: {business.phone}</span>
            {business.licenseNumber && (
              <>
                <span>•</span>
                <span>
                  GSTIN: {business.licenseNumber}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Invoice Meta and Client details */}
        <div className="flex justify-between items-start py-8 text-xs text-[#5c503b] border-b border-[#ebdcb9]">
          <div className="bg-[#fbf9f0] border border-[#ebdcb9] rounded-lg p-4 min-w-[240px]">
            <h4 className="font-bold text-[#8c6b3e] uppercase tracking-wider text-[10px] mb-2">BILL TO</h4>
            <div className="text-[#332a1e] space-y-1">
              <p className="font-bold text-sm break-words">{invoice.customerName}</p>
              {invoice.customerAddress && (
                <p className="text-[11px] text-[#5c503b] whitespace-pre-line leading-relaxed">
                  {invoice.customerAddress}
                </p>
              )}
              {invoice.customerPhone && (
                <p className="text-[11px] font-medium text-[#5c503b] mt-1">Contact: {invoice.customerPhone}</p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <h4 className="font-bold text-[#8c6b3e] uppercase tracking-wider text-[10px] mb-2">INVOICE META</h4>
            <div className="space-y-1">
              <p><span className="text-[#8c6b3e]">Invoice Number:</span> <span className="font-bold text-[#332a1e]">#{invoice.invoiceNumber}</span></p>
              <p><span className="text-[#8c6b3e]">Date of Issue:</span> <span className="font-bold text-[#332a1e]">{invoice.date}</span></p>
              <p><span className="text-[#8c6b3e]">Date of Due:</span> <span className="font-bold text-[#332a1e]">{invoice.dueDate || 'Upon Receipt'}</span></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-8">
          <table className="w-full text-left border-collapse text-xs text-[#332a1e]">
            <thead>
              <tr className="border-b border-[#ebdcb9] font-bold text-[#8c6b3e] uppercase tracking-wider">
                <th className="pb-3 text-left w-[8%]">S.No.</th>
                <th className="pb-3 text-left w-[15%]">Date</th>
                <th className="pb-3 text-left w-[45%]">Description</th>
                <th className="pb-3 text-right">
                  {business.productCategory === 'Bakery' ? 'Weight' : 'Quantity'}
                </th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f4e9]">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#fcfbf7]">
                  <td className="py-3 text-[#70644e] italic">{idx + 1}</td>
                  <td className="py-3 text-[#70644e] italic">{item.date}</td>
                  <td className="py-3 font-semibold break-words whitespace-pre-wrap max-w-[280px]">{item.description}</td>
                  <td className="py-3 text-right italic">{item.weightOrQty}</td>
                  <td className="py-3 text-right">₹{item.rate.toLocaleString()}</td>
                  <td className="py-3 text-right font-bold" style={{ color: primaryColor }}>
                    ₹{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculations & Signature */}
      <div className="border-t border-[#ebdcb9] pt-8">
        <div className="flex justify-between items-start gap-8 w-full">
          <div className="space-y-4 max-w-[60%]">
            {/* Notes */}
            <div className="text-[10px] text-[#70644e] italic leading-relaxed">
              <h4 className="font-bold text-[#8c6b3e] not-italic uppercase tracking-wider mb-1">Notes & Conditions</h4>
              <p className="whitespace-pre-line">{invoice.terms || 'Your custom notes appear here.'}</p>
            </div>

            {/* In Words */}
            <div className="text-[10px] text-[#70644e] bg-[#fbf9f0] p-3 rounded border border-[#ebdcb9] leading-snug">
              <span className="font-bold text-[#8c6b3e] block uppercase tracking-wider text-[9px] mb-0.5">Rupees in Words</span>
              <span>{invoice.totalAmountInWords}</span>
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="text-xs space-y-2 w-full max-w-[280px] flex-shrink-0">
            <div className="flex justify-between text-[#70644e]">
              <span>Subtotal:</span>
              <span className="font-bold">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            
            {invoice.taxPercent > 0 && (
              <div className="flex justify-between text-[#70644e]">
                <span>GST ({invoice.taxPercent}%):</span>
                <span className="font-bold">₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
            )}

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Discount:</span>
                <span className="font-bold">-₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-[#ebdcb9] pt-3 flex justify-between font-extrabold text-sm" style={{ color: primaryColor }}>
              <span>Total Payable:</span>
              <span>₹{invoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        {customization.showSignature && (
          <div className="flex justify-between items-end mt-12 pt-6 border-t border-[#f7f4e9]">
            <span className="text-[9px] font-bold text-[#8c6b3e] tracking-widest uppercase">ELEGANT DESIGN</span>
            <div className="text-center min-w-[200px]">
              {customization.signatureUrl ? (
                <img
                  src={customization.signatureUrl}
                  alt="Signature"
                  className="h-14 object-contain mx-auto my-1"
                />
              ) : (
                <div className="font-cursive text-2xl text-[#634e32] my-1 font-semibold pr-4">
                  {customization.signatureName || business.ownerName}
                </div>
              )}
              <div className="h-0.5 bg-[#ebdcb9] w-full mx-auto" />
              <span className="text-[8px] font-bold text-[#8c6b3e] uppercase tracking-wider block mt-1">Authorised Signature</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
