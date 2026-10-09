import { Router } from 'express';
import mongoose from 'mongoose';
import Interest from '../models/Interest.js';
import Startup from '../models/Startup.js';
import { HttpError } from '../http-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { interestResponseInput, isDuplicateKeyError } from '../validation.js';

const router = Router();
router.use(requireAuth);

router.get('/sent', requireRole('investor'), async (request, response) => {
  const interests = await Interest.find({ investor: request.user.id })
    .sort({ createdAt: -1 })
    .populate('startup', 'name industry location');
  response.json({ interests });
});

router.get('/received', requireRole('founder'), async (request, response) => {
  const startups = await Startup.find({ founder: request.user.id }).select('_id');
  const interests = await Interest.find({ startup: { $in: startups.map(({ id }) => id) } })
    .sort({ createdAt: -1 })
    .populate('startup', 'name')
    .populate('investor', 'name email');
  response.json({ interests });
});

router.post('/startups/:startupId', requireRole('investor'), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.startupId)) throw new HttpError(404, 'Startup not found.');
    const startup = await Startup.findById(request.params.startupId);
    if (!startup) throw new HttpError(404, 'Startup not found.');
    const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';
    if (message.length > 1000) throw new HttpError(400, 'Message must be 1000 characters or fewer.');
    const interest = await Interest.create({
      startup: startup.id,
      investor: request.user.id,
      message,
    });
    response.status(201).json({ interest });
  } catch (error) {
    if (isDuplicateKeyError(error)) return next(new HttpError(409, 'You have already expressed interest in this startup.'));
    next(error);
  }
});

router.patch('/:interestId/respond', requireRole('founder'), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.interestId)) throw new HttpError(404, 'Interest not found.');
    const { status } = interestResponseInput(request.body);
    const interest = await Interest.findById(request.params.interestId);
    if (!interest) throw new HttpError(404, 'Interest not found.');
    const startup = await Startup.findOne({ _id: interest.startup, founder: request.user.id });
    if (!startup) throw new HttpError(404, 'Interest not found.');
    if (interest.status !== 'pending') throw new HttpError(409, 'This interest has already been answered.');

    interest.status = status;
    await interest.save();
    response.json({ interest });
  } catch (error) {
    next(error);
  }
});

export default router;
