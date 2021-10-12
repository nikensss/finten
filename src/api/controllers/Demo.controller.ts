import { Request, Response, Router } from 'express';
import FinTenDB from '../../classes/db/FinTenDB';
import Controller from './Controller.interface';

class DemoController implements Controller {
  public readonly path = '/demo';
  public readonly router = Router();

  private static readonly TICKERS = [
    'AAPL',
    'AMZN',
    'FB',
    'GOOG',
    'IBM',
    'MSFT',
    'NVDA',
    'ORCL',
    'TSLA'
  ];

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/tickers', this.getDemoTickers.bind(this));
    this.router.get('/filings', this.getDemoFilings.bind(this));
  }

  private async getDemoTickers(req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ tickers: DemoController.TICKERS });
  }

  private async getDemoFilings(req: Request, res: Response): Promise<Response> {
    try {
      const { ticker } = req.query;

      if (typeof ticker !== 'string') {
        throw new Error(`Invalid ticker received: ${ticker}`);
      }

      if (!DemoController.TICKERS.includes(ticker)) {
        return res.sendStatus(403);
      }

      const filings = await FinTenDB.getInstance().getFilings(ticker);
      filings.forEach((f) => (f.TradingSymbol = ticker));

      if (ticker === 'AAPL') {
        return res.status(200).json({ filings });
      }

      return res.status(200).json({ filings: filings.slice(0, 4) });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
}

export default DemoController;
