import { Request, Response, Router } from 'express';
import FinTenDB from '../../classes/db/FinTenDB';
import Controller from './Controller.interface';

class DemoController implements Controller {
  public readonly path = '/demo';
  public readonly router = Router();

  private static readonly TICKERS = [
    'AAPL',
    'AMZN',
    'CRM',
    'FB',
    'GOOG',
    'IBM',
    'JPM',
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
      const filings = await FinTenDB.getFilings('AAPL');
      return res.status(200).json({ filings });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
}

export default DemoController;
