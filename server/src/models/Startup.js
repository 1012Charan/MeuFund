import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  industry: { type: String, trim: true, maxlength: 80, default: '' },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  stage: { type: String, trim: true, maxlength: 80, default: '' },
  fundingGoal: { type: Number, min: 0 },
}, { timestamps: true });

export default mongoose.models.Startup ?? mongoose.model('Startup', startupSchema);
