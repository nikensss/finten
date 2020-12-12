import { Request, Response, Router } from 'express';
import Controller from './Controller.interface';
import { default as LOGGER } from '../../logger/DefaultLogger';
import FinTenDB from '../../db/FinTenDB';
import FinTen from '../FinTen';
import SecGov from '../../secgov/SecGov';
import DownloadManager from '../../download/DownloadManager';
import path from 'path';
import { isAdmin } from '../../auth/Passport';

class SecGovController implements Controller {
  public readonly path = '/secgov';
  public readonly router = Router();

  private interval: NodeJS.Timeout | undefined;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //we need to bind all these methods again due to the reference to 'this'
    //when getting the logger
    this.router.get('/fill', isAdmin, this.fill.bind(this));
    this.router.get('/reparse', isAdmin, this.reparse.bind(this));
    this.router.get('/buildCompanyInfo', isAdmin, this.buildCompanyInfo.bind(this));
    this.router.get('/autoupdate', isAdmin, this.autoUpdate.bind(this));
  }

  /**
   *
   * Description: fill the database with the data available from SecGov
   *
   * URL: https://finten.weirwood.ai/secgov/fill?start={START}[&end={END}]
   *
   * Method: GET
   *
   * Requires admin authentication
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
   * Error responses:
   *  -Code: 400 Bad Request Error
   *    *Content: JSON object with property 'error' and value 'missing data: start'
   *
   *  -Code: 401 Unauthorized
   *    *Invalid authentication token
   */
  private fill(req: Request, res: Response): Response {
    const { start, end = start } = req.query;

    if (!start) {
      return res.status(400).json({
        error: 'missing data: start'
      });
    }

    LOGGER.get(this.constructor.name).info(`filling database from ${start} to ${end}`);

    const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
    finten
      .addNewFilings(parseInt(start as string), parseInt(end as string))
      .catch((e) => res.status(400).json({ error: e }));

    return res.status(200).json({
      start,
      end
    });
  }

  /**
   * Description: go through the documents in the VisitedLinks collection that
   * have the error property to something different than null, visit the link
   * again and try to parse that XBRL again.
   */
  private reparse(req: Request, res: Response): Response {
    LOGGER.get(this.constructor.name).info('reparsing documents from links with errors');

    const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
    finten.retryProblematicFilings();

    return res.status(200).json({
      message: 'reparsing...'
    });
  }

  /**
   * Build the CompanyInfo collection from the file available in the same folder
   * as this file.
   */
  private buildCompanyInfo(req: Request, res: Response): Response {
    const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
    finten.buildCompanyInfo(path.join(__dirname, 'company_info.csv'));

    return res.status(200).json({
      message: 'building CompanyInfo collection'
    });
  }

  /**
   *
   * Description: sets up an recurring update of the database
   *
   * URL: https://finten.weirwood.ai/secgov/autoupdate?[interval={INTERVAL}][&stop={STOP}]
   *
   * Method: GET
   *
   * Requires admin authentication
   *
   * URL params:
   *  -Required:
   *    -at least one optional parameter is required
   *  -Optional:
   *    + interval=[number]: the time between updates in milliseconds
   *    + stop=[boolean]: whether to stop the autoupdate or not
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON object with the status of the processing.
   *
   * Error responses:
   *  -Code: 400 Bad Request Error
   *    *Content: JSON object with the status of the processing.
   *
   *  -Code: 401 Unauthorized
   *    *Invalid authentication token
   *
   *  -Code: 500 Internal Server Error
   *    *Something went bananas on the server side
   */
  private autoUpdate(req: Request, res: Response): Response {
    const { interval, stop } = req.query;

    if (typeof interval !== 'string' && typeof stop !== 'string') {
      return res.status(400).json({ error: 'no parameters provided' });
    }

    if (typeof stop === 'string') {
      if (stop === 'true') {
        //if stop is specified and its value is the string 'true', stop the interval
        if (this.interval) {
          clearInterval(this.interval);
        }
      }
      //if no new interval is specified, return already
      if (typeof interval !== 'string') {
        return res.status(200).json({ message: 'interval stopped' });
      }
    }

    //if there is an interval specified
    if (typeof interval === 'string') {
      //parse it
      const intervalTime = parseInt(interval, 10);
      //and check that it is neither NaN not infinite (aka: check the parsing
      //returned a valid number)
      if (isNaN(intervalTime) || !isFinite(intervalTime)) {
        return res.status(400).json({ error: 'invalid interval value' });
      }

      //if there was an interval already set, clear that one first
      if (this.interval) {
        clearInterval(this.interval);
      }

      //and then set the new one
      this.interval = setInterval(() => {
        const finten = new FinTen(new SecGov(), FinTenDB.getInstance());
        finten.addNewFilings(new Date().getFullYear());
      }, intervalTime);

      return res.status(200).json({
        message: 'new update interval configured',
        interval: intervalTime
      });
    }

    return res.status(500).json({
      error:
        'Internal server error. Please contact the support team from Weirwood to inform about this issue.'
    });
  }
}

export default SecGovController;
