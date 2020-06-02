import { Router } from 'express';
import { fintendb } from '../../../db/FinTenDB';

const company = Router();

company.get('/', (req, res) => {
  res.json({
    message: 'company route 😎'
  });
});

company.get('/names', async (req, res) => {
  const dbquery = await fintendb.find({
    query: {
      $select: ['EntityRegistrantName']
    }
  });

  res.json({
    names: [...new Set(dbquery.map((r: any) => r.EntityRegistrantName))]
  });
});

company.get('/tickers', async (req, res) => {
  const dbquery = await fintendb.find({
    query: {
      $select: ['TradingSymbol']
    }
  });

  res.json({
    names: [...new Set(dbquery.map((r: any) => r.TradingSymbol))]
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

  const dbquery = await fintendb.find({
    paginate: false,
    query: {
      EntityRegistrantName: name
    }
  });

  res.json({
    name,
    data: dbquery
  });
});

export default company;
