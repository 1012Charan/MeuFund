import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['founder', 'investor'] },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform(_document, value) {
    delete value.passwordHash;
    delete value.__v;
    return value;
  },
});

export default mongoose.models.User ?? mongoose.model('User', userSchema);
