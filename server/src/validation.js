import { HttpError } from './http-error.js';

const validRoles = new Set(['founder', 'investor']);
const editableStartupFields = [
  'name',
  'description',
  'industry',
  'location',
  'stage',
  'fundingGoal',
];

export function registrationInput(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role;

  if (!name || name.length > 80) {
    throw new HttpError(400, 'Name is required and must be 80 characters or fewer.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 100) {
    throw new HttpError(400, 'Password must be between 8 and 100 characters.');
  }
  if (!validRoles.has(role)) {
    throw new HttpError(400, 'Role must be founder or investor.');
  }

  return { name, email, password, role };
}

export function loginInput(body = {}) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }
  return { email, password };
}

export function startupInput(body = {}, { partial = false } = {}) {
  const values = {};
  for (const field of editableStartupFields) {
    if (body[field] !== undefined) values[field] = body[field];
  }

  for (const field of ['name', 'description', 'industry', 'location', 'stage']) {
    if (values[field] === undefined && !partial) values[field] = '';
    if (values[field] !== undefined) {
      if (typeof values[field] !== 'string') {
        throw new HttpError(400, `${field} must be text.`);
      }
      values[field] = values[field].trim();
    }
  }

  if (!partial && (!values.name || !values.description)) {
    throw new HttpError(400, 'Startup name and description are required.');
  }
  if (values.name?.length > 100 || values.description?.length > 3000) {
    throw new HttpError(400, 'Startup name or description is too long.');
  }
  if (values.fundingGoal !== undefined && values.fundingGoal !== null && values.fundingGoal !== '') {
    const amount = Number(values.fundingGoal);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new HttpError(400, 'Funding goal must be a non-negative amount.');
    }
    values.fundingGoal = amount;
  } else {
    delete values.fundingGoal;
  }

  return values;
}

export function interestResponseInput(body = {}) {
  if (!['accepted', 'declined'].includes(body.status)) {
    throw new HttpError(400, 'Response status must be accepted or declined.');
  }
  return { status: body.status };
}

export function assertRole(user, role) {
  if (!user || user.role !== role) {
    throw new HttpError(403, `This action is for ${role}s only.`);
  }
}

export function assertOwner(userId, ownerId) {
  if (String(userId) !== String(ownerId)) {
    throw new HttpError(403, 'You do not have access to this record.');
  }
}

export function isDuplicateKeyError(error) {
  return error?.code === 11000;
}
