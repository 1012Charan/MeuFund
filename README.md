# MeuFund

MeuFund is a small marketplace for startup founders and investors. A founder creates a profile that investors can browse. An investor can express interest once, and the founder can accept or decline it.

## What is included

- Email and password registration with a single role chosen at signup: `founder` or `investor`.
- Founder startup profiles with create and edit actions. New profiles are visible to signed-in investors right away.
- Investor startup search, profile details, and one interest per investor and startup.
- Role-specific dashboards for startup profiles, submitted interests, and incoming interests.

## Technologies

- JavaScript, React, and Vite for the client.
- Node.js and Express for the API.
- MongoDB with Mongoose for data storage.
- JWT and bcryptjs for authentication.
- Node's built-in test runner for tests.
- The root npm workspace runs both apps and their tests.

## Setup and running locally

You need Node.js with npm and a MongoDB instance. Start MongoDB, then run these commands from the repository root:

```sh
npm install
cp .env.example server/.env
cp client/.env.example client/.env.local
npm run dev
```

The client runs at `http://localhost:5173`; the API listens at `http://localhost:5001`. Keep `MONGODB_URI` and `JWT_SECRET` in `server/.env`. The client has its own `client/.env.local` file for `VITE_API_URL`; it points to `http://localhost:5001/api` by default and contains no server credentials. Vite reads client environment files from `client/`, and you need to restart the dev server after changing them.

## Checks

```sh
npm test
npm run build --workspace client
```

`npm test` runs both test suites. Server API tests exercise the Express app, routes, middleware, JWT and bcrypt authentication, input validation, and authorization. They use in-memory fakes for persistence, so they are not full MongoDB integration tests. Client tests cover client-side helpers. Both `npm test` and `npm run build --workspace client` passed.

## Main API routes

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/startups` and `GET /api/startups/:startupId`
- `POST /api/startups` and `PATCH /api/startups/:startupId` for founders
- `POST /api/interests/startups/:startupId` and `GET /api/interests/sent` for investors
- `GET /api/interests/received` and `PATCH /api/interests/:interestId/respond` for founders

Registration and sign-in are public. Startup and interest routes, plus `/api/auth/me`, require a bearer token; `/api/health` is also public. Startup writes are limited to the founder who owns the profile. Interest records have a unique startup/investor index so the same investor cannot submit twice.

## AI Development Experience

Code0 was the AI development tool used for this project; Kiro was not used. I used Code0 to help implement and debug parts of the project, then reviewed the changes and checked them with tests and a client build:

1. Planned and set up the MERN workspace, then added the startup and investor-interest API routes.
2. Implemented email/password registration and login, password hashing, JWT authentication, and founder/investor access checks.
3. Built the React signup flow, startup search and editing screens, and role-specific dashboards.
4. Investigated `React is not defined` errors from missing imports and API configuration problems involving MongoDB environment settings, Vite's client env file, CORS preflight, and a backend port conflict.
5. Added client and server tests, including Express route tests with in-memory database fakes, and reviewed what those tests do and do not verify.
