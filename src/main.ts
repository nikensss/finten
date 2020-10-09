import FinTenAPI from './classes/finten/FinTenAPI';

const api = new FinTenAPI();
api.setRoutes();

export default api.listen();
