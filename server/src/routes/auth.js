import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../http-error.js';
import { isDuplicateKeyError, loginInput, registrationInput } from '../validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function createToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function authResponse(user) {
  return { token: createToken(user), user: user.toJSON() };
}

router.post('/register', async (request, response, next) => {
  try {
    const input = registrationInput(request.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });
    response.status(201).json(authResponse(user));
  } catch (error) {
    if (isDuplicateKeyError(error)) return next(new HttpError(409, 'An account with this email already exists.'));
    next(error);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const { email, password } = loginInput(request.body);
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Email or password is incorrect.');
    }
    response.json(authResponse(user));
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.user });
});

export default router;
