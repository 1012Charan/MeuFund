import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpError } from '../src/http-error.js';
import {
  assertOwner,
  assertRole,
  interestResponseInput,
  isDuplicateKeyError,
  loginInput,
  registrationInput,
  startupInput,
} from '../src/validation.js';

test('registration normalizes email and requires one supported role', () => {
  assert.deepEqual(registrationInput({
    name: '  Sam Founder ',
    email: ' SAM@EXAMPLE.COM ',
    password: 'long-password',
    role: 'founder',
  }), {
    name: 'Sam Founder',
    email: 'sam@example.com',
    password: 'long-password',
    role: 'founder',
  });
  assert.throws(() => registrationInput({ name: 'Sam', email: 'sam@example.com', password: 'long-password', role: 'both' }), HttpError);
});

test('login input normalizes the email and rejects missing credentials', () => {
  assert.deepEqual(loginInput({ email: ' USER@example.com ', password: 'secret' }), {
    email: 'user@example.com',
    password: 'secret',
  });
  assert.throws(() => loginInput({ email: 'user@example.com' }), HttpError);
});

test('startup input trims text, accepts non-negative funding goals, and rejects bad amounts', () => {
  assert.deepEqual(startupInput({ name: ' MeuFund ', description: ' A marketplace ', fundingGoal: '25000' }), {
    name: 'MeuFund', description: 'A marketplace', industry: '', location: '', stage: '', fundingGoal: 25000,
  });
  assert.throws(() => startupInput({ name: 'MeuFund', description: 'A marketplace', fundingGoal: -1 }), HttpError);
});

test('role and ownership checks prevent cross-account writes', () => {
  assert.doesNotThrow(() => assertRole({ role: 'founder' }, 'founder'));
  assert.throws(() => assertRole({ role: 'investor' }, 'founder'), HttpError);
  assert.doesNotThrow(() => assertOwner('user-1', 'user-1'));
  assert.throws(() => assertOwner('user-1', 'user-2'), HttpError);
});

test('founder responses allow only accepted or declined, and duplicate-key errors are recognized', () => {
  assert.deepEqual(interestResponseInput({ status: 'accepted' }), { status: 'accepted' });
  assert.throws(() => interestResponseInput({ status: 'pending' }), HttpError);
  assert.equal(isDuplicateKeyError({ code: 11000 }), true);
  assert.equal(isDuplicateKeyError({ code: 400 }), false);
});
