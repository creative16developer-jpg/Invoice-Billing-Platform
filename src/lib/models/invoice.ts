import mongoose, { Schema } from 'mongoose';

const InvoiceItemSchema = new Schema({
  date: { type: String, required: true }, // e.g., '15/05/2026' or '5th'
  description: { type: String, required: true }, // e.g., 'Chocolate Choco Chips'
  weightOrQty: { type: String, required: true }, // e.g., '1.5 kg' or '2'
  rate: { type: Number, required: true },
  amount: { type: Number, required: true }
});

const InvoiceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  date: { type: String, required: true }, // Format: DD/MM/YYYY or YYYY-MM-DD
  dueDate: { type: String, default: '' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  totalAmountInWords: { type: String, required: true },
  terms: { type: String, default: '' },
  status: { type: String, enum: ['Paid', 'Unpaid', 'Overdue'], default: 'Unpaid' },
  templateId: { type: String, default: 'classic' },
  templateCustomization: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
