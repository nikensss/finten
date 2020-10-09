import { Router } from 'express';
import { isPremium } from '../../../classes/auth/Passport';
import FinTenDB from '../../../classes/db/FinTenDB';

const company = Router();

company.get('/', (req, res) => {
  res.json({
    message: 'company route 😎'
  });
});

company.get('/names', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const names = await db.distinctFilingKey('EntityRegistrantName');

  res.status(200).json({
    names
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

  const dbquery = await db.findFilings(
    { EntityRegistrantName: name },
    { _id: 0 }
  );

  res.status(200).json({
    name,
    data: dbquery
  });
});

company.get('/tickers', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const tickers = await db.distinctFilingKey('TradingSymbol');

  res.status(200).json({
    tickers
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

  try {
    const db = await FinTenDB.getInstance();
    const dbquery = await db.findFilings({ TradingSymbol: ticker }, { _id: 0 });

    return res.status(200).json({
      ticker,
      data: dbquery
    });
  } catch (ex) {
    return res.status(500).json({
      error: ex
    });
  }
});

company.get('/ecik', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const ciks = await db.distinctFilingKey('EntityCentralIndexKey');

  res.status(200).json({
    ciks
  });
});

export default company;
