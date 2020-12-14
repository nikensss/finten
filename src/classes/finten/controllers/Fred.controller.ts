import { Request, Response, Router } from 'express';
import Controller from './Controller.interface';
import FinTenDB from '../../db/FinTenDB';
import FinTen from '../FinTen';
import { isAdmin } from '../../auth/Passport';
import { byName } from '../../fred/Macro.enum';
import SecGov from '../../secgov/SecGov';

class FredController implements Controller {
  public readonly path = '/fred';
  public readonly router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //we need to bind all these methods again due to the reference to 'this'
    //when getting the logger
    this.router.get('/macros', isAdmin, this.addMacro.bind(this));
  }

  private addMacro(req: Request, res: Response): void {
    const { macro } = req.query;

    if (typeof macro !== 'string') {
      res.status(401).json({ message: 'invalid macro name' });
      return;
    }

    try {
      const macroAsMacro = byName(macro);
      const finten = new FinTen(new SecGov(), FinTenDB.getInstance());
      finten.addMacro(macroAsMacro);
      res.status(200).json({ macro: macroAsMacro, status: 'ongoing' });
    } catch (ex) {
      res.status(400).json({ error: ex.toString() });
    }
  }
}

export default FredController;
