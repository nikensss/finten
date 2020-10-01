import path from 'path';
import { Router } from 'express';
import { default as LOGGER } from '../../../classes/logger/DefaultLogger';
import FinTen from '../../../FinTen';

const secgovRoutes = Router();

secgovRoutes.get('/', (req, res) => {
  res.json({
    message: 'secgov route 🍟'
  });
});

// secgovRoutes.get('/doc', (req, res) => {
//   res.sendFile(path.join(__dirname, 'doc.html'));
// });

/**
 * URL: /api/secgov/fill
 *
 * Method: GET
 *
 * URL params:
 *  -Required:
 *    + start=[number]: indicates the year from which to start getting data
 *  -Optional:
 *    + end=[number]: indicates the year up to which to get data from
 *
 * Success response:
 *  -Code: 200
 *  -Content: JSON object with the received start and end dates as an ACK.
 *
 * Error response:
 *  -Code: 400 Bad Request Error
 *  -Content: JSON object with property 'error' and value 'missing data: start'
 */
secgovRoutes.get('/fill', async (req, res) => {
  const { start, end = start } = req.query;

  if (!start) {
    return res.status(400).json({
      error: 'missing data: start'
    });
  }

  LOGGER.get('secgov-routes/fill').info(
    'secgov-routes/fill',
    `filling database with all the data between ${start} and ${end}`
  );

  FinTen.create().fill(parseInt(start as string), parseInt(end as string));

  return res.status(200).json({
    start,
    end
  });
});

secgovRoutes.get('/fix', async (req, res) => {
  LOGGER.get('secgov-routes/fix').info(
    'secgov-routes/fix',
    `revisiting and reparsing documents from links with errors`
  );

  FinTen.create().fix();

  return res.status(200).json({
    message: 'performing fix...'
  });
});

export default secgovRoutes;
