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

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //we need to bind all these methods again due to the reference to 'this'
    //when getting the logger
    this.router.get('/fill', isAdmin, this.fill.bind(this));
    this.router.get('/reparse', isAdmin, this.reparse.bind(this));
    this.router.get('/buildCompanyInfo', isAdmin, this.buildCompanyInfo.bind(this));
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
}

export default SecGovController;
