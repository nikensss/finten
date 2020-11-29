import { Request, Response, Router } from 'express';
import { userAuthentication } from '../../auth/Passport';
import CompanyInfoModel from '../../db/models/CompanyInfo';
import FilingModel, { FilingDocument } from '../../db/models/Filing';
import { UserDocument } from '../../db/models/User';
import Controller from './Controller.interface';

class CompanyController implements Controller {
  public readonly path = '/company';
  public readonly router = Router();

  private static readonly ACCESSIBLE_TICKERS = [
    'AAPL',
    'GOOG',
    'FB',
    'MSFT',
    'ORCL',
    'NVDA',
    'CRM',
    'IBM',
    'AMZN',
    'TSLA',
    'JPM'
  ];

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/tickers', this.getTickers);
    this.router.get('/filings', userAuthentication, this.getFilings);
    this.router.get('/eciks', this.getEciks);
  }

  /**
   * Description: returns the tickers of all available companies. Use this endpoint
   * to figure out which tickers can be used in the /filings endpoint.
   *
   * URL: https://finten.weirwood.ai/api/company/tickers
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
    // await FinTenDB.getInstance().connect();
    // const tickers = (
    //   await CompanyInfoModel.find({}, null, { sort: { TradingSymbol: 1 } })
    //     .select('TradingSymbol')
    //     .exec()
    // )
    //   .map((d) => d.TradingSymbol)
    //   .filter((tradingSymbol) => typeof tradingSymbol === 'string');

    const tickers = CompanyController.ACCESSIBLE_TICKERS;
    return res.status(200).json({ tickers });
  }

  /**
   * Description: returns all the filings available for the indicated company.
   *
   * URL: https://finten.weirwood.ai/api/company/filings?ticker={TICKER}
   *
   * Method: GET
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

    if (!CompanyController.ACCESSIBLE_TICKERS.includes(ticker as string)) {
      return res.status(403).json({
        error: 'Invalid credentials'
      });
    }

    try {
      const companyInfo = await CompanyInfoModel.findByTradingSymbol(ticker);

      if (companyInfo === null) {
        throw new Error(`Unknown company '${ticker}'!`);
      }

      let filings: FilingDocument[] = [];
      const filingsCursor = FilingModel.find({
        EntityCentralIndexKey: companyInfo.EntityCentralIndexKey
      }).cursor();

      await filingsCursor.eachAsync(async (f: FilingDocument) => {
        filings.push(f);
      });

      if (!user.isPremium) {
        filings = filings.slice(-8);
      }

      return res.status(200).json({
        ticker,
        filings,
        companyInfo
      });
    } catch (ex) {
      return res.status(500).json({ error: ex });
    }
  }

  private async getEciks(req: Request, res: Response): Promise<Response> {
    const eciks = await FilingModel.distinct('EntityCentralIndexKey');
    return res.status(200).json({ eciks });
  }
}

export default CompanyController;
