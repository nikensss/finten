import { Router } from 'express';
import FinTenDB from '../../../classes/db/FinTenDB';
import { FilingDocument } from '../../../classes/db/models/Filing';

const company = Router();

const accessibleTickers = [
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

company.get('/', (req, res) => {
  res.json({
    message: 'company route 😎'
  });
});

company.get('/tickers', async (req, res) => {
  // await FinTenDB.getInstance().connect();
  // const tickers = (
  //   await CompanyInfoModel.find({}, null, { sort: { TradingSymbol: 1 } })
  //     .select('TradingSymbol')
  //     .exec()
  // )
  //   .map((d) => d.TradingSymbol)
  //   .filter((tradingSmbol) => typeof tradingSmbol === 'string');

  const tickers = accessibleTickers;
  res.status(200).json({ tickers });
});

company.get('/filings', async (req, res) => {
  const { ticker } = req.query;

  if (!ticker || typeof ticker !== 'string' || (ticker as string).length === 0) {
    return res.status(400).json({
      error: 'no ticker given'
    });
  }

  if (!accessibleTickers.includes(ticker as string)) {
    return res.status(403).json({
      error: 'forbidden access'
    });
  }

  try {
    const db = await FinTenDB.getInstance().connect();
    const filingsCursor = db.findFilings({
      TradingSymbol: ticker
    });

    const filings: FilingDocument[] = [];
    await filingsCursor.eachAsync(async (f: FilingDocument) => {
      filings.push(f);
    });

    return res.status(200).json({
      ticker,
      filings
      // companyInfo
    });
  } catch (ex) {
    return res.status(500).json({
      error: ex
    });
  }
});

company.get('/eciks', async (req, res) => {
  const db = await FinTenDB.getInstance().connect();

  const ciks = await db.distinctFilingKey('EntityCentralIndexKey');

  res.status(200).json({
    ciks
  });
});

export default company;
