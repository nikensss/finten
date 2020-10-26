// import path from 'path';
import { Router } from 'express';
import { default as LOGGER } from '../../../classes/logger/DefaultLogger';
import FinTen from '../../../classes/finten/FinTen';
import SecGov from '../../../classes/secgov/SecGov';
import DownloadManager from '../../../classes/download/DownloadManager';
import FinTenDB from '../../../classes/db/FinTenDB';
import path from 'path';

const secgovRoutes = Router();

secgovRoutes.get('/', (req, res) => {
  res.json({
    message: 'secgov route 🍟'
  });
});

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
    `filling database with all the data between ${start} and ${end}`
  );

  const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
  finten.addNewFilings(parseInt(start as string), parseInt(end as string));

  return res.status(200).json({
    start,
    end
  });
});

secgovRoutes.get('/reparse', async (req, res) => {
  LOGGER.get('secgov-routes/fix').info('revisiting and reparsing documents from links with errors');

  const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
  finten.retryProblematicFilings();

  return res.status(200).json({
    message: 'reparsing...'
  });
});

secgovRoutes.get('/buildCompanyInfo', async (req, res) => {
  const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
  finten.buildCompanyInfo(path.join(__dirname, 'company_info.csv'));

  return res.status(200).json({
    message: 'building CompanyInfo collection'
  });
});

export default secgovRoutes;
