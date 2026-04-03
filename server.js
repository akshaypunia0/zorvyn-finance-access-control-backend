import dotenv from 'dotenv';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Set it in your .env file (used to sign auth tokens).');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 4001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
