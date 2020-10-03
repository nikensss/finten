import XBRL from '../secgov/XBRL';
import FormType from '../filings/FormType';
import FinTenDB from '../db/FinTenDB';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import Downloadable from '../download/Downloadable';
import XBRLUtilities from '../secgov/XBRLUtilities';
import { VisitedLink, VisitedLinkStatus } from '../db/models/VisitedLinkSchema';

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

  public async fill(start: number, end: number = start, amount?: number) {
    this.logger.logLevel = LogLevel.DEBUG;

    const newFilings = await this.getNewFilings(start, end, amount);

    const fintendb = await FinTenDB.getInstance();

    for (let n = 0; n < newFilings.length; n++) {
      this.logPercentage(n, newFilings.length);

      const filings = await this.secgov.get(newFilings[n]);

      for (let filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);

          if (xbrl.get().DocumentFiscalYearFocus > (end || start)) {
            this.logger.warning(
              `Document fiscal year focus of downloaded XBRL > than end date!: ${
                xbrl.get().DocumentFiscalYearFocus
              }`
            );
          }
          const result = await fintendb.insertFiling(xbrl.get());

          await fintendb.insertVisitedLink({
            url: filing.url,
            status: VisitedLinkStatus.OK,
            error: null,
            filingId: result._id
          });

          this.logger.info(
            `Added filing for fiscal year ${
              xbrl.get().DocumentFiscalYearFocus
            } (object id: ${result._id})`
          );
        } catch (ex) {
          this.logger.warning(
            `Error while parsing txt to XBRL at ${filing}:\n${ex}`
          );

          await fintendb.insertVisitedLink({
            url: filing.url,
            status: VisitedLinkStatus.ERROR,
            error: ex.toString(),
            filingId: null
          });
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
    const fintendb: FinTenDB = await FinTenDB.getInstance();

    const linksWithErrors: VisitedLink[] = await fintendb.findVisitedLinks(
      { status: 'error' },
      'url'
    );

    const downloadablesWithErros: Downloadable[] = linksWithErrors.map(f => ({
      url: f.url,
      fileName: 'filing.txt'
    }));

    for (let n = 0; n < downloadablesWithErros.length; n++) {
      const percentageDownloads =
        ((n + 1) / downloadablesWithErros.length) * 100;
      this.logger.info(
        `🛎 ${n + 1}/${
          downloadablesWithErros.length
        } (${percentageDownloads.toFixed(3)} %)`
      );

      const filings = await this.secgov.get(downloadablesWithErros[n]);

      for (let filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await fintendb.insertFiling(xbrl.get());

          await fintendb.updateVisitedLinks(
            { url: filing.url },
            {
              status: VisitedLinkStatus.OK,
              error: null,
              filingId: result._id
            }
          );

          this.logger.info(`Could now parse from ${filing.url}!`);
        } catch (ex) {
          this.logger.info(`Could still not parse from ${filing.url}`);
        }
      }
      this.secgov.flush();
    }

    this.secgov.flush();
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
    const fintendb = await FinTenDB.getInstance();
    const visitedLinks = await fintendb.findVisitedLinks();

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
