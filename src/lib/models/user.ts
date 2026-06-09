import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['Developer', 'Merchant'], default: 'Merchant' },
  password: { type: String, required: true },
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  businessType: { 
    type: String, 
    enum: ['Retailer', 'Wholesaler', 'Manufacturer', 'Baker', 'Other'], 
    default: 'Retailer' 
  },
  productCategory: { 
    type: String, 
    enum: ['Bakery', 'Electronics', 'Groceries', 'Apparel', 'Other'], 
    default: 'Bakery' 
  },
  logoUrl: { type: String, default: '' },
  licenseNumber: { type: String, default: '' }, // FSSAI or GSTIN, etc.
  isVerified: { type: Boolean, default: true },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  templateSettings: {
    primaryColor: { type: String, default: '#b91c1c' }, // Cakespot red
    secondaryColor: { type: String, default: '#1f2937' },
    fontFamily: { type: String, default: 'Inter' },
    headerLayout: { type: String, default: 'classic' },
    showLogo: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
    signatureUrl: { type: String, default: '' },
    signatureName: { type: String, default: '' },
    customTerms: { type: String, default: '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to local jurisdiction only' }
  }
}, { timestamps: true });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.User;
}

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
