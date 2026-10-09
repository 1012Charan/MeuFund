import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../http-error.js';

export async function requireAuth(request, _response, next) {
  try {
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Sign in to continue.');

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('name email role');
    if (!user) throw new HttpError(401, 'Sign in to continue.');
    request.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Your session is invalid or has expired.'));
  }
}

export function requireRole(role) {
  return (request, _response, next) => {
    if (request.user?.role !== role) {
      return next(new HttpError(403, `This action is for ${role}s only.`));
    }
    next();
  };
}
