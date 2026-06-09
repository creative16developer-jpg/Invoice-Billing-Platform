import mongoose, { Schema } from 'mongoose';

const ItemSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  rate: { type: Number, required: true, min: 0 },
  unit: { 
    type: String, 
    enum: ['Pcs', 'kg', 'gm', 'liter', 'ml'], 
    default: 'Pcs' 
  }
}, { timestamps: true });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Item;
}

export const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
