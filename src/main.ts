import FinTen from './FinTen';
import dotenv from 'dotenv';

const result = dotenv.config();

if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
  throw new Error('No downloads directory in .env');
}

FinTen.asAPI();
// FinTen.main();
