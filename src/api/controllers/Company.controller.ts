import { Request, Response, Router } from 'express';
import { FinTenDB } from '../../classes/db/FinTenDB';
import CompanyInfoModel from '../../classes/db/models/CompanyInfo';
import { FilingDocument } from '../../classes/db/models/Filing';
import { UserDocument } from '../../classes/db/models/User';
import { isRegistered } from '../auth/Passport';
import Controller from './Controller.interface';
import DemoController from './Demo.controller';

class CompanyController implements Controller {
  public readonly path = '/company';
  public readonly router = Router();

  private tickers: string[] = [];

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/tickers', this.getTickers.bind(this));
    this.router.get('/filings', isRegistered, this.getFilings);

    const demo: Controller = new DemoController();
    this.router.use(demo.path, demo.router);
  }

  /**
   * Description: returns the tickers of all available companies. Use this endpoint
   * to figure out which tickers can be used in the /filings endpoint.
   *
   * URL: https://finten.weirwood.ai/company/tickers
   *
   * Method: GET
   *
   * URL params:
   *  -None
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *tickers:
   *      +type: string[]
   *      +content: the tickers of the available companies
   *
   * Error response:
   *  -Code: 401 Unauthorized
   *    *Invalid authentication token (must be, at least, premium user)
   */
  private async getTickers(req: Request, res: Response): Promise<Response> {
    if (this.tickers.length === 0) {
      this.tickers = (
        await CompanyInfoModel.find({}, null, { sort: { TradingSymbol: 1 } })
          .select('TradingSymbol')
          .exec()
      )
        .map((d) => d.TradingSymbol)
        .filter((tradingSymbol): tradingSymbol is string => typeof tradingSymbol === 'string');
    }

    return res.status(200).json({ tickers: this.tickers });
  }

  /**
   * Description: returns all the filings available for the indicated company.
   *
   * URL: https://finten.weirwood.ai/company/filings?ticker={TICKER}
   *
   * Method: GET
   *
   * Headers:
   *  -Authorization: as Bearer token
   *    *this token can be obtained by logging in (see Users.controller::login)
   *
   * URL params:
   *  -ticker=[string]: the ticker of the company whose filings are requested
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *ticker:
   *      +type: string
   *      +content: the received ticker (as an ACK)
   *    *filings:
   *      +type: FilingDocument[]
   *      +content: all the available filings
   *    *companyInfo:
   *      +type: CompanyInfoDocument
   *      +content: an object with all the data known of this company
   *
   * Error responses:
   *  -Code: 400 Bad request
   *    *ticker param is not present of has invalid format
   *
   * -Code: 401 Unauthorized
   *    *invalid authentication token (must be, at least, premium)
   *
   * -Code: 403 Forbidden
   *    *the requested ticker cannot be accessed
   *
   * -Code: 500 Internal server error
   *    *the request could not be processed
   *    *the error is sent in a JSON response (under the property error)
   */
  private async getFilings(req: Request, res: Response): Promise<Response> {
    const user: UserDocument = req.user as UserDocument;
    if (typeof user === 'undefined') {
      return res.status(403).json({
        error: 'Invalid credentials'
      });
    }

    const { ticker } = req.query;
    if (!ticker || typeof ticker !== 'string' || (ticker as string).length === 0) {
      return res.status(400).json({
        error: 'Invalid ticker'
      });
    }

    try {
      const companyInfo = await FinTenDB.getInstance().getCompanyInfo(ticker);

      if (companyInfo === null) {
        throw new Error(`Unknown company '${ticker}'!`);
      }

      const filings: FilingDocument[] = await FinTenDB.getInstance().getFilings(ticker);
      // for user friendliness, reassign the trading symbol in the filing to
      // match the one the user asked for
      filings.forEach((f) => (f.TradingSymbol = ticker));

      return res.status(200).json({
        ticker,
        filings,
        companyInfo
      });
    } catch (ex) {
      return res.status(500).send(ex.message);
    }
  }
}

export default CompanyController;
