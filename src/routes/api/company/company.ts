import { Router } from 'express';
import FinTenDB from '../../../classes/db/FinTenDB';

const company = Router();

company.get('/', (req, res) => {
  res.json({
    message: 'company route 😎'
  });
});

company.get('/names', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const names = await db.distinct('EntityRegistrantName');

  res.json({
    names
  });
});

company.get('/tickers', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const tickers = await db.distinct('TradingSymbol');
  // const tickers = [
  //   'AAPL',
  //   'AMZN',
  //   'CRM',
  //   'FB',
  //   'GOOG',
  //   'IBM',
  //   'JPM',
  //   'MSFT',
  //   'NVDA',
  //   'ORCL',
  //   'TSLA'
  // ];

  res.json({
    tickers
  });
});

company.get('/cik', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const cik = await db.distinct('EntityCentralIndexKey');

  res.json({
    cik
  });
});

company.get('/ticker', async (req, res) => {
  const { ticker } = req.query;

  if (!ticker || (ticker as string).length === 0) {
    return res.status(400).json({
      error: 'no ticker given'
    });
  }

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

  if (!accessibleTickers.includes(ticker as string)) {
    return res.status(403).json({
      error: 'forbidden access'
    });
  }

  const db = await FinTenDB.getInstance();
  const dbquery = await db.findFilings(
    {
      TradingSymbol: ticker
    },
    { _id: 0 }
  );

  res.json({
    ticker,
    data: dbquery
  });
});

company.get('/name', async (req, res) => {
  //object destructuring
  const { name } = req.query;

  if (!name || (name as string).length === 0) {
    return res.status(400).json({
      error: 'no name given'
    });
  }
  const db = await FinTenDB.getInstance();

  const dbquery = await db.findFilings({
    EntityRegistrantName: name
  });

  res.json({
    name,
    data: dbquery
  });
});

export default company;
