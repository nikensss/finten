import CompanyController from './classes/finten/controllers/Company.controller';
import FinTenAPI from './classes/finten/FinTenAPI';

const companyController = new CompanyController();
const api = new FinTenAPI([companyController]);
api.setRoutes();

export default api.listen();
