import { Request, Response, Router } from 'express';
import Controller from './Controller.interface';
import FinTenDB from '../../classes/db/FinTenDB';
import FinTen from '../../classes/finten/FinTen';
import { isAdmin, isPremium, isRegistered } from '../../classes/auth/Passport';
import Macro, { byName, getMacroCollection } from '../../classes/fred/Macro.enum';
import SecGov from '../../classes/secgov/SecGov';

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
    this.router.get('/names', isRegistered, this.getMacrosNames.bind(this));
    this.router.get('/get', isPremium, this.getMacro.bind(this));
  }

  /**
   * Description: add the values of the given macro to the db.
   *
   * URL: https://finten.weirwood.ai/fred/add?macro={MACRO}
   *
   * Method: POST
   *
   * Headers:
   *  -Authorization: as Bearer token
   *    *this token can be obtained by logging in (see Users.controller::login)
   *
   * URL params:
   *  -macro=[string]: the name of the macro (see
   *  Fred.controller::getMacrosNames for more the exact values)
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *macro:
   *      +type: string
   *      +value: the received macro name (as ACK)
   *    *status:
   *      +type: string
   *      +value: 'ongoing'
   *
   * Error responses:
   * -Code: 400 Bad Request
   *    *invalid macro requested
   * -Code: 401 Unauthorized
   *    *invalid authentication token (must be admin)
   */
  private addMacro(req: Request, res: Response): void {
    const { macro: macroName } = req.query;

    if (typeof macroName !== 'string') {
      res.status(400).json({ error: 'invalid macro name' });
      return;
    }

    try {
      const macro = byName(macroName);
      const finten = new FinTen(new SecGov(), FinTenDB.getInstance());
      finten.addMacro(macro);
      res.status(200).json({ macro, status: 'ongoing' });
    } catch (ex) {
      res.status(400).json({ error: ex.toString() });
    }
  }

  /**
   * Description: get the names of the macros that can be retrieved.
   *
   * URL: https://finten.weirwood.ai/fred/names
   *
   * Method: GET
   *
   * Headers: none
   *
   * URL params: none
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *names:
   *      +type: string[]
   *      +value: the names of the macros available
   */
  private getMacrosNames(req: Request, res: Response): void {
    res.status(200).json({
      names: Object.values(Macro)
    });
  }

  /**
   * Description: get the values of the given macro from the db.
   *
   * URL: https://finten.weirwood.ai/fred/get?macro={MACRO}
   *
   * Method: GET
   *
   * Headers:
   *  -Authorization: as Bearer token
   *    *this token can be obtained by logging in (see Users.controller::login)
   *
   * URL params:
   *  -macro=[string]: the name of the macro (see
   *  Fred.controller::getMacrosNames for more the exact values)
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *values:
   *      +type: [{date, value}: {Date, number}] (array of date-value pairs)
   *      +value: the value of the macro at different points in time
   *
   * Error responses:
   * -Code: 400 Bad Request
   *    *invalid macro requested
   * -Code: 401 Unauthorized
   *    *invalid authentication token (must be, at least, premium)
   */
  private async getMacro(req: Request, res: Response): Promise<void> {
    const { macro: macroName } = req.query;

    if (typeof macroName !== 'string') {
      res.status(400).json({ error: 'invalid macro name' });
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
