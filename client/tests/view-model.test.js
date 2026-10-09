import assert from 'node:assert/strict';
import test from 'node:test';
import { formatFundingGoal, navigationFor, statusLabel } from '../src/view-model.js';

test('navigation exposes only the screens for the selected account role', () => {
  assert.deepEqual(navigationFor('founder'), ['Dashboard', 'My startups']);
  assert.deepEqual(navigationFor('investor'), ['Dashboard', 'Browse startups']);
  assert.deepEqual(navigationFor('admin'), []);
});

test('pending interest is presented as awaiting a response', () => {
  assert.equal(statusLabel('pending'), 'Awaiting response');
  assert.equal(statusLabel('accepted'), 'accepted');
  assert.equal(statusLabel('declined'), 'declined');
});

test('funding goals are formatted as USD with an empty fallback', () => {
  assert.equal(formatFundingGoal(25000), '$25,000');
  assert.equal(formatFundingGoal(undefined), 'Not specified');
});
