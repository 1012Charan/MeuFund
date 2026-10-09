import { Router } from 'express';
import mongoose from 'mongoose';
import Startup from '../models/Startup.js';
import { HttpError } from '../http-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { startupInput } from '../validation.js';

const router = Router();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.use(requireAuth);

router.get('/', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 100) : '';
  const filter = query
    ? { $or: ['name', 'description', 'industry', 'location', 'stage'].map((field) => ({
      [field]: { $regex: escapeRegExp(query), $options: 'i' },
    })) }
    : {};
  const startups = await Startup.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('founder', 'name');
  response.json({ startups });
});

router.get('/mine', requireRole('founder'), async (request, response) => {
  const startups = await Startup.find({ founder: request.user.id }).sort({ createdAt: -1 });
  response.json({ startups });
});

router.get('/:startupId', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.startupId)) throw new HttpError(404, 'Startup not found.');
    const startup = await Startup.findById(request.params.startupId).populate('founder', 'name');
    if (!startup) throw new HttpError(404, 'Startup not found.');
    response.json({ startup });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('founder'), async (request, response, next) => {
  try {
    const startup = await Startup.create({ ...startupInput(request.body), founder: request.user.id });
    response.status(201).json({ startup });
  } catch (error) {
    next(error);
  }
});

router.patch('/:startupId', requireRole('founder'), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.startupId)) throw new HttpError(404, 'Startup not found.');
    const startup = await Startup.findOneAndUpdate(
      { _id: request.params.startupId, founder: request.user.id },
      startupInput(request.body, { partial: true }),
      { new: true, runValidators: true },
    );
    if (!startup) throw new HttpError(404, 'Startup not found.');
    response.json({ startup });
  } catch (error) {
    next(error);
  }
});

export default router;
