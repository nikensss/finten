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

  const dbquery = await db.findFilings({}, { EntityRegistrantName: 1, _id: 0 });

  const names = [
    ...new Set(dbquery.map((d: any) => d.EntityRegistrantName))
  ].sort((a, z) => (a <= z ? -1 : 1));

  res.json({
    names
  });
});

company.get('/tickers', async (req, res) => {
  const db = await FinTenDB.getInstance();

  const dbquery = await db.findFilings({}, { TradingSymbol: 1, _id: 0 });

  const tickers = [
    ...new Set(dbquery.map((d: any) => d.TradingSymbol))
  ].sort((a, z) => (a <= z ? -1 : 1));

  res.json({
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
  const db = await FinTenDB.getInstance();

  const dbquery = await db.findFilings({
    TradingSymbol: ticker
  });

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
