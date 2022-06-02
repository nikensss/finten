import { Request, Response, Router } from 'express';
import path from 'path';
import { FinTenDB } from '../../classes/db/FinTenDB';
import DownloadManager from '../../classes/download/DownloadManager';
import { FinTen } from '../../classes/finten/FinTen';
import { default as LOGGER } from '../../classes/logger/DefaultLogger';
import { Logger } from '../../classes/logger/Logger.interface';
import SecGov from '../../classes/secgov/SecGov';
import { isAdmin } from '../auth/Passport';
import Controller from './Controller.interface';

class SecGovController implements Controller {
  public readonly path = '/secgov';
  public readonly router = Router();
  private logger: Logger = LOGGER.get(this.constructor.name);

  private interval: NodeJS.Timeout | undefined;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //we need to bind all these methods again due to the reference to 'this'
    //when getting the logger
    this.router.post('/fill', isAdmin, this.fill.bind(this));
    this.router.post('/reparse', isAdmin, this.reparse.bind(this));
    this.router.post('/build-company-info', isAdmin, this.buildCompanyInfo.bind(this));
    this.router.post('/autoupdate', isAdmin, this.autoUpdate.bind(this));
    this.router.post('/extract-xbrl-documents', isAdmin, this.extractXbrlDocument.bind(this));
  }

  /**
   *
   * Description: fill the database with the data available from SecGov
   *
   * URL: https://finten.weirwood.ai/secgov/fill?start={START}[&end={END}]
   *
   * Method: POST
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

    if (!start) return res.status(400).json({ error: 'missing data: start' });
    if (typeof start !== 'string') return res.status(403).json({ error: 'start is not a string' });
    if (typeof end !== 'string') return res.status(403).json({ error: 'end is not a string' });

    this.logger.info(`filling database from ${start} to ${end}`);

    const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());
    finten
      .addNewFilings(parseInt(start), parseInt(end))
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
    this.logger.info('reparsing documents from links with errors');

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
   * Description: sets up a recurring update of the database
   *
   * URL: https://finten.weirwood.ai/secgov/autoupdate?[interval={INTERVAL}][&stop={STOP}]
   *
   * Method: POST
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

    if (!interval && !stop) return res.status(400).json({ error: 'no parameters provided' });

    try {
      if (stop === 'true' && this.interval) clearInterval(this.interval);

      if (!interval) return res.status(200).json({ message: 'update interval stopped' });

      if (typeof interval !== 'string') {
        return res.status(400).json({ error: `invalid interval type ${typeof interval}` });
      }

      const intervalTime = parseInt(interval, 10);
      if (isNaN(intervalTime) || !isFinite(intervalTime)) {
        return res.status(400).json({ error: `invalid interval value ${interval}` });
      }

      if (this.interval) clearInterval(this.interval);

      this.interval = setInterval(() => {
        const finten = new FinTen(new SecGov(), FinTenDB.getInstance());
        finten.addNewFilings(new Date().getFullYear());
      }, intervalTime);

      return res.status(200).json({
        message: 'autoupdate interval time set',
        interval: intervalTime
      });
    } catch (ex) {
      // TODO: log the error somewhere
      return res.status(500).json({ error: 'could not update interval time' });
    }
  }

  private extractXbrlDocument(
    req: Request,
    res: Response
  ): Response<unknown, Record<string, unknown>> {
    if (process.env.ENV !== 'dev') return res.sendStatus(403).end();
    const { url } = req.body;
    if (!url) return res.status(400).send({ error: 'missing url' }).end();

    const finten = new FinTen(new SecGov(), FinTenDB.getInstance());
    finten.extractXbrlDocuments(url);
    return res.sendStatus(200).end();
  }
}

export default SecGovController;
