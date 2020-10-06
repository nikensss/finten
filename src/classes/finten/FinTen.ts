import FormType from '../filings/FormType';
import FinTenDB from '../db/FinTenDB';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import Downloadable from '../download/Downloadable';
import XBRLUtilities from '../secgov/XBRLUtilities';
import { VisitedLinkModel, VisitedLinkStatus } from '../db/models/VisitedLink';
import { Schema } from 'mongoose';
import { Filing } from '../db/models/Filing';

class FinTen {
  private downloadsDirectory: string;
  private secgov: SecGov;

  //FIXME: this is coupling! Find a way to decouple
  public constructor(downloadsDirectory: string) {
    this.downloadsDirectory = downloadsDirectory;
    this.secgov = new SecGov(this.downloadsDirectory);
  }

  /**
   * Creates an instance of FinTen. Use this method to guarantee the use of the
   * environment variable DOWNLOADS_DIRECTORY.
   */
  public static create(): FinTen {
    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No DOWNLOADS_DIRECTORY in .env');
    }
    return new FinTen(process.env.DOWNLOADS_DIRECTORY);
  }

  public use(secgov: SecGov): this {
    this.secgov = secgov;
    return this;
  }

  /**
   * Fill the database with the data between the start and end years (both included)
   * up to the specified amount (if specified). If no end year is given, the method
   * will fill for only the start year.
   *
   * @param start year from which to start downloading data (inclusive)
   * @param end year at which to stop downloading data (inclusive)
   * @param amountOfFilings total amount of filings to download
   */
  public async fill(
    start: number,
    end: number = start,
    amountOfFilings?: number
  ) {
    this.logger.logLevel = LogLevel.DEBUG;

    const newFilings = await this.getNewFilingsMetaData(
      start,
      end,
      amountOfFilings
    );

    for (let n = 0; n < newFilings.length; n++) {
      this.logPercentage(n, newFilings.length);

      const filings = await this.secgov.get(newFilings[n]);

      for (let filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await this.insertFiling(xbrl.get());
          await this.insertVisitedLink(filing.url, result._id);
        } catch (ex) {
          await this.handleExceptionDuringFilingInsertion(filing.url, ex);
        }
      }
      this.secgov.flush();
    }
    this.secgov.flush();
    this.logger.info(`Done filling!`);
  }

  public async fix() {
    this.logger.logLevel = LogLevel.DEBUG;
    this.logger.info(`Getting broken links`);
    const db: FinTenDB = await FinTenDB.getInstance();

    const downloadablesWithErros = await this.getVisitedLinksWithErrorsAsDownloadables();

    for (let n = 0; n < downloadablesWithErros.length; n++) {
      this.logPercentage(n, downloadablesWithErros.length);

      const filings = await this.secgov.get(downloadablesWithErros[n]);

      for (let filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await this.insertFiling(xbrl.get());

          await db.updateVisitedLinks(
            { url: filing.url },
            {
              status: VisitedLinkStatus.OK,
              error: null,
              filingId: result._id
            }
          );

          this.logger.info(`Could now parse from ${filing.url}!`);
        } catch (ex) {
          this.logger.info(`Could not parse from ${filing.url}. Error: ${ex}`);
        }
      }
      this.secgov.flush();
    }
    this.secgov.flush();
  }

  private async getVisitedLinksWithErrorsAsDownloadables() {
    const db = await FinTenDB.getInstance();
    const linksWithErrors: VisitedLinkModel[] = await db.findVisitedLinks(
      { status: VisitedLinkStatus.ERROR },
      { url: 1 }
    );

    return linksWithErrors.map(f => ({
      url: f.url,
      fileName: 'filing.txt'
    }));
  }

  //Private implementations
  private get logger() {
    return LOGGER.get(this.constructor.name);
  }

  private logPercentage(currentIndex: number, length: number) {
    const percentageDownloads = ((currentIndex + 1) / length) * 100;
    this.logger.info(
      `🛎 ${currentIndex + 1}/${length} (${percentageDownloads.toFixed(3)} %)`
    );
  }

  private async getNewFilingsMetaData(
    start: number,
    end: number,
    amountOfFilings?: number
  ) {
    try {
      const filingReportsMetaData = await this.getFilingsMetaData(
        start,
        end,
        amountOfFilings
      );
      const db = await FinTenDB.getInstance();
      const visitedLinks = await db.findVisitedLinks();
      return filingReportsMetaData.filter(
        f => !visitedLinks.find(v => v.url === f.url)
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async getFilingsMetaData(
    start: number,
    end: number,
    amount?: number
  ) {
    this.secgov.flush();

    const indices = await this.secgov.getIndices(start, end);
    const filings = this.secgov.parseIndices(
      indices,
      [FormType.F10K, FormType.F10Q],
      amount
    );
    this.secgov.flush();
    return filings;
  }

  private async insertFiling(filing: Filing) {
    try {
      const db = await FinTenDB.getInstance();
      return await db.insertFiling(filing);
    } catch (e) {
      throw new Error(e);
    }
  }

  private async insertVisitedLink(
    url: string,
    resultId: Schema.Types.ObjectId
  ) {
    try {
      const db = await FinTenDB.getInstance();
      return await db.insertVisitedLink({
        url,
        status: VisitedLinkStatus.OK,
        error: null,
        filingId: resultId
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  private async handleExceptionDuringFilingInsertion(url: string, ex: any) {
    this.logger.warning(`Error while parsing ${url}:\n${ex.toString()}`);
    const db = await FinTenDB.getInstance();
    return await db.insertVisitedLink({
      url,
      status: VisitedLinkStatus.ERROR,
      error: ex.toString(),
      filingId: null
    });
  }
}

export default FinTen;
