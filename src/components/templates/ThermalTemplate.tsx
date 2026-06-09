import React from 'react';
import { TemplateProps } from './ClassicTemplate';

export const ThermalTemplate: React.FC<TemplateProps> = ({ invoice, business, customization }) => {
  const primaryColor = customization.primaryColor || '#000000';
  const fontFamily = customization.fontFamily || 'Courier New, Courier, monospace';

  return (
    <div 
      className="p-4 bg-white text-slate-900 mx-auto select-none"
      style={{ 
        fontFamily: fontFamily.includes('monospace') ? fontFamily : 'Courier New, Courier, monospace',
        width: '300px',
        fontSize: '11px',
        lineHeight: '1.4'
      }}
    >
      {/* Header / Shop Details */}
      <div className="text-center space-y-1">
        {customization.showLogo && business.logoUrl && (
          <img 
            src={business.logoUrl} 
            alt="Logo" 
            className="h-10 w-10 rounded-full object-contain mx-auto mb-1.5"
          />
        )}
        <h2 className="font-black text-sm uppercase tracking-wider text-black">{business.businessName}</h2>
        {business.ownerName && <p className="text-[10px] text-slate-700">Prop: {business.ownerName}</p>}
        {business.address && <p className="text-[10px] text-slate-600 leading-tight whitespace-pre-line">{business.address}</p>}
        {business.phone && <p className="text-[10px] text-slate-700">Ph: {business.phone}</p>}
        {business.licenseNumber && (
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            GSTIN/LIC: {business.licenseNumber}
          </p>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-slate-400 my-3" />

      {/* Receipt Info */}
      <div className="space-y-1 text-[10px] text-slate-800">
        <div className="flex justify-between">
          <span className="font-bold">INVOICE NO:</span>
          <span>#{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">DATE:</span>
          <span>{invoice.date}</span>
        </div>
        {invoice.dueDate && (
          <div className="flex justify-between">
            <span className="font-bold">DUE DATE:</span>
            <span>{invoice.dueDate}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-bold">BILL TO:</span>
          <span className="font-medium truncate max-w-[180px]">{invoice.customerName}</span>
        </div>
        {invoice.customerPhone && (
          <div className="flex justify-between">
            <span className="font-bold">PHONE:</span>
            <span>{invoice.customerPhone}</span>
          </div>
        )}
        {invoice.customerAddress && (
          <div className="flex justify-between">
            <span className="font-bold">ADDRESS:</span>
            <span className="truncate max-w-[180px]">{invoice.customerAddress}</span>
          </div>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-slate-400 my-3" />

      {/* Items Section */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-[10px] font-bold text-black border-b border-dashed border-slate-300 pb-1">
          <span>ITEM DESCRIPTION</span>
          <span>AMOUNT</span>
        </div>
        
        {invoice.items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="font-bold text-black text-[10.5px] break-words whitespace-pre-wrap max-w-full">
              {idx + 1}. {item.description.toUpperCase()}
            </div>
            <div className="flex justify-between text-slate-700 text-[10px] pl-3">
              <span>
                {item.weightOrQty} x ₹{item.rate.toLocaleString()}
              </span>
              <span className="font-bold text-black">
                ₹{item.amount.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-slate-400 my-3" />

      {/* Totals Section */}
      <div className="space-y-1 text-slate-800">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{invoice.subtotal.toLocaleString()}</span>
        </div>
        
        {invoice.taxPercent > 0 && (
          <div className="flex justify-between">
            <span>GST ({invoice.taxPercent}%):</span>
            <span>₹{invoice.taxAmount.toLocaleString()}</span>
          </div>
        )}

        {invoice.discountAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-₹{invoice.discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between font-black text-black text-xs">
          <span>TOTAL PAYABLE:</span>
          <span>₹{invoice.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-slate-400 my-3" />

      {/* Amount in words */}
      <div className="text-[9px] text-slate-700 leading-snug">
        <span className="font-bold uppercase block text-[8px] text-slate-500 mb-0.5">Rupees in Words</span>
        <span className="italic">{invoice.totalAmountInWords}</span>
      </div>

      {/* Terms and conditions */}
      {invoice.terms && (
        <>
          <div className="border-t border-dashed border-slate-200 my-2" />
          <div className="text-[8.5px] text-slate-600 leading-tight">
            <span className="font-bold block uppercase text-[7.5px] text-slate-400 mb-0.5">Terms / Notes</span>
            <p className="whitespace-pre-line">{invoice.terms}</p>
          </div>
        </>
      )}

      {/* Signature block */}
      {customization.showSignature && (
        <div className="mt-5 pt-3 border-t border-dotted border-slate-200 text-center">
          {customization.signatureUrl ? (
            <img 
              src={customization.signatureUrl} 
              alt="Signature" 
              className="h-8 object-contain mx-auto mb-1 max-w-[120px]"
            />
          ) : (
            <div className="font-cursive text-base text-rose-800 font-semibold select-none leading-none mb-1">
              {customization.signatureName || business.ownerName}
            </div>
          )}
          <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">
            Authorised Signatory
          </span>
        </div>
      )}

      <div className="border-t border-dashed border-slate-400 my-3" />
      
      {/* Thank you note */}
      <div className="text-center text-[9px] font-bold text-black uppercase tracking-widest mt-1">
        *** THANK YOU! VISIT AGAIN ***
      </div>
    </div>
  );
};
