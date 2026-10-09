import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.API_PORT ?? 5001);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI must be set before starting the server.');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before starting the server.');
}

await mongoose.connect(mongoUri);

app.listen(port, () => {
  console.log(`MeuFund API listening on port ${port}`);
});
