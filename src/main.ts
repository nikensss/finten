import CompanyController from './classes/finten/controllers/Company.controller';
import SecGovController from './classes/finten/controllers/SecGov.controller';
import UsersController from './classes/finten/controllers/Users.controller';
import FinTenAPI from './classes/finten/FinTenAPI';

const companyController = new CompanyController();
const usersController = new UsersController();
const secgovController = new SecGovController();

//prepare a new server with the routes added by the given controllers
const fintenAPI = new FinTenAPI([companyController, usersController, secgovController]);
//spin up the server
const app = fintenAPI.listen();

//exporting 'app' to be able to test the routes with mocha
export default app;
