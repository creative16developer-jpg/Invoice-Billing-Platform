import mongoose, { Schema } from 'mongoose';

const InvitationSchema = new Schema({
  email: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  used: { type: Boolean, default: false },
  usedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', InvitationSchema);
