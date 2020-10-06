import FormType from '../filings/FormType';
import FinTenDB from '../db/FinTenDB';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import Downloadable from '../download/Downloadable';
import XBRLUtilities from '../secgov/XBRLUtilities';
import { VisitedLinkModel, VisitedLinkStatus } from '../db/models/VisitedLink';
import { Schema } from 'mongoose';

class FinTen {
  private downloadsDirectory: string;
  private secgov: SecGov;

  private constructor(downloadsDirectory: string) {
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

  /**
   * Fill the database with the data between the start and end years (both included)
   * up to the specified amount (if specified). If no end year is given, the method
   * will fill for only the start year.
   *
   * @param start year from which to start downloading data (inclusive)
   * @param end year at which to stop downloading data (inclusive)
   * @param amount total amount of filings to download
   */
  public async fill(start: number, end: number = start, amount?: number) {
    this.logger.logLevel = LogLevel.DEBUG;

    const newFilings = await this.getNewFilings(start, end, amount);

    for (let n = 0; n < newFilings.length; n++) {
      this.logPercentage(n, newFilings.length);

      const filings = await this.secgov.get(newFilings[n]);

      for (let filing of filings) {
        try {
          const result = await this.insertFiling(filing);
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

  private async insertFiling(filing: Downloadable) {
    const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
    const result = await FinTenDB.getInstance()
      .then(db => db.insertFiling(xbrl.get()))
      .catch(e => {
        throw new Error(e);
      });

    this.logger.info(
      `Added filing for fiscal year ${
        xbrl.get().DocumentFiscalYearFocus
      } (object id: ${result._id})`
    );

    return result;
  }

  private async insertVisitedLink(
    url: string,
    resultId: Schema.Types.ObjectId
  ) {
    await FinTenDB.getInstance()
      .then(db =>
        db.insertVisitedLink({
          url,
          status: VisitedLinkStatus.OK,
          error: null,
          filingId: resultId
        })
      )
      .catch(e => {
        throw new Error(e);
      });
  }

  private async handleExceptionDuringFilingInsertion(url: string, ex: any) {
    this.logger.warning(`Error while parsing ${url}:\n${ex.toString()}`);
    const db = await FinTenDB.getInstance();
    await db.insertVisitedLink({
      url,
      status: VisitedLinkStatus.ERROR,
      error: ex.toString(),
      filingId: null
    });
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
          // const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          // const result = await fintendb.insertFiling(xbrl.get());
          const result = await this.insertFiling(filing);

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
      { status: 'error' },
      'url'
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

  private async getNewFilings(
    start: number,
    end: number,
    amount: number | undefined
  ) {
    const filings = await this.getFilings(start, end, amount);
    const visitedLinks = await FinTenDB.getInstance()
      .then(db => db.findVisitedLinks())
      .catch(e => {
        throw new Error(e);
      });

    return filings.filter(f => !visitedLinks.find(v => v.url === f.url));
  }

  private async getFilings(
    start: number,
    end: number,
    amount: number | undefined
  ) {
    this.secgov.flush();

    await this.secgov.getIndices(start, end);
    const filings = this.secgov.parseIndices(
      [FormType.F10K, FormType.F10Q],
      amount
    );
    this.secgov.flush();
    return filings;
  }
}

export default FinTen;
