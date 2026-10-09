import mongoose from 'mongoose';

const interestSchema = new mongoose.Schema({
  startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
  investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true });

interestSchema.index({ startup: 1, investor: 1 }, { unique: true });

export default mongoose.models.Interest ?? mongoose.model('Interest', interestSchema);
