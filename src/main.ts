import CompanyController from './api/controllers/Company.controller';
import FredController from './api/controllers/Fred.controller';
import SecGovController from './api/controllers/SecGov.controller';
import UsersController from './api/controllers/Users.controller';
import FinTenAPI from './api/FinTenAPI';

const companyController = new CompanyController();
const usersController = new UsersController();
const secgovController = new SecGovController();
const fredController = new FredController();

//prepare a new server with the routes added by the given controllers
const fintenAPI = new FinTenAPI([
  companyController,
  usersController,
  secgovController,
  fredController
]);
//spin up the server
const app = fintenAPI.listen();

//exporting 'app' to be able to test the routes with mocha
export default app;
