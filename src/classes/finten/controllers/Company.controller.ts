import { Router } from 'express';
import Controller from './Controller.interface';

class CompanyController implements Controller {
  public readonly path = '/company';
  public readonly router = Router();

  constructor() {
    this.initialiseRoutes();
  }

  private initialiseRoutes() {
    console.log('initialising routes');
  }
}

export default CompanyController;
