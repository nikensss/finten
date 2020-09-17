import FinTen from './FinTen';
import FinTenAPI from './FinTenAPI';


if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
  throw new Error('No downloads directory in .env');
}

FinTen.main();
const api = new FinTenAPI();
api.setRoutes();

export default api.listen();