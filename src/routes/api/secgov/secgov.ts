import { Router } from 'express';
import { default as LOGGER } from '../../../classes/logger/DefaultLogger';
import FinTen from '../../../FinTen';

const secgovRoutes = Router();

secgovRoutes.get('/', (req, res) => {
  res.json({
    message: 'secgov route 🍟'
  });
});

secgovRoutes.get('/add', async (req, res) => {
  const { start, end = start } = req.query;

  if (!start) {
    return res.status(400).json({
      error: 'missing data: start'
    });
  }

  LOGGER.get('secgov-routes/add').info(
    'secgov-routes/add',
    `filling database with all the data between ${start} and ${end}`
  );

  const finten = FinTen.create();
  finten.fill(parseInt(start as string), parseInt(end as string));

  return res.json({
    start,
    end
  });
});

export default secgovRoutes;
