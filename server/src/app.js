import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import startupRoutes from './routes/startups.js';
import interestRoutes from './routes/interests.js';
import { HttpError } from './http-error.js';

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/interests', interestRoutes);

app.use((error, _request, response, _next) => {
  if (error instanceof HttpError) {
    return response.status(error.status).json({ message: error.message });
  }
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return response.status(400).json({ message: 'Please check the submitted details.' });
  }
  console.error(error);
  response.status(500).json({ message: 'Something went wrong.' });
});

export default app;
