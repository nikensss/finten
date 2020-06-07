import { Router } from 'express';

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

  //req.finten.fill(parseInt(start as string), parseInt(end as string));

  return res.json({
    start,
    end
  });
});

export default secgovRoutes;
