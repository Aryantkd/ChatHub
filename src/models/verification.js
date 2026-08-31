import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  idDocumentFrontUrl: String,
  idDocumentBackUrl: String,
  selfieWithIdUrl: String,
  documentType: { type: String, enum: ['passport', 'national_id', 'drivers_license'] },
  extractedName: String,
  extractedDOB: Date,
  extractedCountry: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' },
  reviewerAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  reviewedAt: Date,
  isOver18: { type: Boolean, default: false }
}, { timestamps: true });

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;