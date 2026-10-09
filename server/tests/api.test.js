import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import http from 'node:http';
import net from 'node:net';
import app from '../src/app.js';
import Interest from '../src/models/Interest.js';
import Startup from '../src/models/Startup.js';
import User from '../src/models/User.js';

const originals = {
  userCreate: User.create,
  userFindOne: User.findOne,
  userFindById: User.findById,
  startupCreate: Startup.create,
  startupFindById: Startup.findById,
  startupFindOne: Startup.findOne,
  startupFindOneAndUpdate: Startup.findOneAndUpdate,
  interestCreate: Interest.create,
  interestFindById: Interest.findById,
};
const originalJwtSecret = process.env.JWT_SECRET;
const users = new Map();
const startups = new Map();
const interests = new Map();
let nextId = 1;

function makeId() {
  return String(nextId++).padStart(24, '0');
}

function userDocument(input) {
  const user = { ...input, _id: input._id ?? makeId() };
  user.id = user._id;
  user.toJSON = () => ({ _id: user._id, id: user.id, name: user.name, email: user.email, role: user.role });
  return user;
}

function query(value) {
  return { select: async () => value };
}

function installModelFakes() {
  User.create = async (input) => {
    if ([...users.values()].some((user) => user.email === input.email)) {
      const error = new Error('Duplicate email');
      error.code = 11000;
      throw error;
    }
    const user = userDocument(input);
    users.set(user.id, user);
    return user;
  };
  User.findOne = (filter) => query([...users.values()].find((user) => user.email === filter.email) ?? null);
  User.findById = (id) => query(users.get(String(id)) ?? null);

  Startup.create = async (input) => {
    const startup = { ...input, _id: makeId(), id: null };
    startup.id = startup._id;
    startups.set(startup.id, startup);
    return startup;
  };
  Startup.findById = async (id) => startups.get(String(id)) ?? null;
  Startup.findOne = async (filter) => {
    const startup = startups.get(String(filter._id));
    return startup?.founder === filter.founder ? startup : null;
  };
  Startup.findOneAndUpdate = async (filter, update) => {
    const startup = startups.get(String(filter._id));
    if (!startup || startup.founder !== filter.founder) return null;
    Object.assign(startup, update);
    return startup;
  };

  Interest.create = async (input) => {
    if ([...interests.values()].some((interest) => interest.startup === input.startup && interest.investor === input.investor)) {
      const error = new Error('Duplicate interest');
      error.code = 11000;
      throw error;
    }
    const interest = { ...input, _id: makeId(), id: null, status: 'pending', createdAt: new Date() };
    interest.id = interest._id;
    interest.save = async () => interest;
    interests.set(interest.id, interest);
    return interest;
  };
  Interest.findById = async (id) => interests.get(String(id)) ?? null;
}

function restoreModelFakes() {
  User.create = originals.userCreate;
  User.findOne = originals.userFindOne;
  User.findById = originals.userFindById;
  Startup.create = originals.startupCreate;
  Startup.findById = originals.startupFindById;
  Startup.findOne = originals.startupFindOne;
  Startup.findOneAndUpdate = originals.startupFindOneAndUpdate;
  Interest.create = originals.interestCreate;
  Interest.findById = originals.interestFindById;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
}

after(restoreModelFakes);

test('API routes enforce authentication, roles, ownership, and interest workflow', async () => {
  process.env.JWT_SECRET = 'test-only-secret';
  installModelFakes();

  function request(path, { token, method = 'GET', body } = {}) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const incoming = new http.IncomingMessage(socket);
      const bodyText = body ? JSON.stringify(body) : '';
      incoming.method = method;
      incoming.url = `/api${path}`;
      incoming.headers = {
        host: 'localhost',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(bodyText ? { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(bodyText)) } : {}),
      };
      const response = new http.ServerResponse(incoming);
      response.end = function end(chunk) {
        const text = chunk ? Buffer.from(chunk).toString() : '';
        resolve({ status: this.statusCode, body: text ? JSON.parse(text) : null });
        socket.destroy();
        return this;
      };
      if (bodyText) incoming.push(Buffer.from(bodyText));
      incoming.push(null);
      app.handle(incoming, response);
    });
  }

  const noToken = await request('/auth/me');
  assert.equal(noToken.status, 401);

  const founderRegistration = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Founder One', email: 'founder@example.com', password: 'password-123', role: 'founder' },
  });
  assert.equal(founderRegistration.status, 201);
  assert.equal(founderRegistration.body.user.role, 'founder');
  assert.equal('passwordHash' in founderRegistration.body.user, false);
  const founderToken = founderRegistration.body.token;

  const founderLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'founder@example.com', password: 'password-123' },
  });
  assert.equal(founderLogin.status, 200);
  assert.equal(founderLogin.body.user.email, 'founder@example.com');
  assert.equal((await request('/auth/me', { token: founderToken })).body.user.role, 'founder');

  const investorRegistration = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Investor One', email: 'investor@example.com', password: 'password-123', role: 'investor' },
  });
  assert.equal(investorRegistration.status, 201);
  const investorToken = investorRegistration.body.token;

  assert.equal((await request('/startups', {
    method: 'POST', token: investorToken, body: { name: 'Forbidden', description: 'Investor cannot create this.' },
  })).status, 403);
  assert.equal((await request('/startups/test-startup-id', {
    method: 'PATCH', token: investorToken, body: { name: 'Forbidden edit' },
  })).status, 403);

  const created = await request('/startups', {
    method: 'POST',
    token: founderToken,
    body: { name: 'MeuFund Demo', description: 'A startup for API testing.' },
  });
  assert.equal(created.status, 201);
  const startupId = created.body.startup.id;

  const updated = await request(`/startups/${startupId}`, {
    method: 'PATCH', token: founderToken, body: { name: 'MeuFund Updated' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.startup.name, 'MeuFund Updated');

  const expressedInterest = await request(`/interests/startups/${startupId}`, {
    method: 'POST', token: investorToken, body: { message: 'Interested in learning more.' },
  });
  assert.equal(expressedInterest.status, 201);
  const firstInterestId = expressedInterest.body.interest.id;

  const duplicateInterest = await request(`/interests/startups/${startupId}`, {
    method: 'POST', token: investorToken, body: { message: 'Duplicate request.' },
  });
  assert.equal(duplicateInterest.status, 409);

  const accepted = await request(`/interests/${firstInterestId}/respond`, {
    method: 'PATCH', token: founderToken, body: { status: 'accepted' },
  });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.interest.status, 'accepted');

  const secondInvestor = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Investor Two', email: 'investor2@example.com', password: 'password-123', role: 'investor' },
  });
  const secondInterest = await request(`/interests/startups/${startupId}`, {
    method: 'POST', token: secondInvestor.body.token, body: { message: 'Another interested investor.' },
  });
  const declined = await request(`/interests/${secondInterest.body.interest.id}/respond`, {
    method: 'PATCH', token: founderToken, body: { status: 'declined' },
  });
  assert.equal(declined.status, 200);
  assert.equal(declined.body.interest.status, 'declined');
});
