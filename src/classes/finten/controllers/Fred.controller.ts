import { Request, Response, Router } from 'express';
import Controller from './Controller.interface';
import FinTenDB from '../../db/FinTenDB';
import FinTen from '../FinTen';
import { isAdmin, isPremium } from '../../auth/Passport';
import Macro, { byName, getMacroCollection } from '../../fred/Macro.enum';
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
    this.router.post('/add', isAdmin, this.addMacro.bind(this));
    this.router.get('/names', this.getMacrosNames.bind(this));
    this.router.get('/get', isPremium, this.getMacro.bind(this));
  }

  /**
   *  POST
   * {**}/fred/add?macro=[DGORDER|ACDGNO|DMOTRC1Q027SBEA|IPDCONGD]
   */
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

  private getMacrosNames(req: Request, res: Response): void {
    res.status(200).json({
      names: Object.values(Macro)
    });
  }

  private async getMacro(req: Request, res: Response): Promise<void> {
    const { macro: macroName } = req.query;

    if (typeof macroName !== 'string') {
      res.status(401).json({ message: 'invalid macro name' });
      return;
    }

    try {
      const macro = byName(macroName);
      const collection = getMacroCollection(macro);
      const values = await collection
        .find({}, null, { sort: { date: 1 } })
        .select({ _id: 0, __v: 0 })
        .exec();
      res.status(200).json({ values });
    } catch (ex) {
      res.status(400).json({ error: ex.toString() });
    }
  }
}

export default FredController;
