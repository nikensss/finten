import FinTen from './FinTen';
import dotenv from 'dotenv';
import FinTenAPI from './FinTenAPI';

const result = dotenv.config();

if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
  throw new Error('No downloads directory in .env');
}

FinTen.main();
// const api = new FinTenAPI();
// api.setRoutes();
// api.listen();
