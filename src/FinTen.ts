import XBRL from './classes/secgov/XBRL';
import FormType from './classes/filings/FormType';
import FinTenDB from './classes/db/FinTenDB';
import SecGov from './classes/secgov/SecGov';
import { default as LOGGER } from './classes/logger/DefaultLogger';
import { LogLevel } from './classes/logger/LogLevel';
import Downloadable from './classes/download/Downloadable';
import ora from 'ora';
import XBRLUtilities from './classes/secgov/XBRLUtilities';

type VisitedLink = {
  url: string;
  status: string;
  error: string | null;
  filingId: string | null;
};

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
    LOGGER.get(this.constructor.name).logLevel = LogLevel.DEBUG;

    this.secgov.flush();

    await this.secgov.getIndices(start, end);
    let filings = this.secgov.parseIndices(
      [FormType.F10K, FormType.F10Q],
      amount
    );
    this.secgov.flush();
    let downloadedDownloadables: Downloadable[] = [];

    const fintendb: FinTenDB = await FinTenDB.getInstance();

    console.log('Getting visited links...');
    const visitedLinks: VisitedLink[] = await fintendb.findVisitedLinks(
      {},
      { url: 1, _id: 0 }
    );

    const newAvailableFilings = filings.filter((f, i, a) => {
      console.log('filtered ' + i + '/' + a.length);
      return !visitedLinks.find(v => v.url === f.url);
    });

    for (let n = 0; n < newAvailableFilings.length; n++) {
      const filing = newAvailableFilings[n];
      const percentageDownloads = ((n + 1) / newAvailableFilings.length) * 100;
      LOGGER.get(this.constructor.name).info(
        this.constructor.name,
        `🛎 ${n + 1}/${
          newAvailableFilings.length
        } (${percentageDownloads.toFixed(3)} %)`
      );

      downloadedDownloadables = await this.secgov.get(filing);

      for (let downloadedDownloadable of downloadedDownloadables) {
        try {
          const xbrl: XBRL = await XBRLUtilities.fromTxt(
            downloadedDownloadable.fileName
          );

          if (xbrl.get().DocumentFiscalYearFocus > (end || start)) {
            LOGGER.get(this.constructor.name).warning(
              this.constructor.name,
              `Document fiscal year focus of downloaded XBRL > than end date!: ${
                xbrl.get().DocumentFiscalYearFocus
              }`
            );
          }
          //BEWARE:
          //the XBRL class is a wrapper around the actual XBRL data. We should
          //only add the XBRL data, thus do 'xbrl.get()' when adding data to the
          //database.
          const result = await fintendb.insertFiling(xbrl.get());

          await fintendb.insertVisitedLink({
            url: downloadedDownloadable.url,
            status: 'ok',
            error: null,
            filingId: result.insertedId
          });

          LOGGER.get(this.constructor.name).info(
            this.constructor.name,
            `Added filing for fiscal year ${
              xbrl.get().DocumentFiscalYearFocus
            } (object id: ${result.insertedId})`
          );
        } catch (ex) {
          LOGGER.get(this.constructor.name).warning(
            this.constructor.name,
            `Error while parsing txt to XBRL at ${downloadedDownloadable}:\n${ex}`
          );

          await fintendb.insertVisitedLink({
            url: downloadedDownloadable.url,
            status: 'error',
            error: ex.toString(),
            filingId: null
          });
        }
      }
      this.secgov.flush();
    }

    this.secgov.flush();

    LOGGER.get(this.constructor.name).info(
      this.constructor.name,
      `Done filling!`
    );
  }

  public async fix() {
    throw new Error('Unsupported!');

    LOGGER.get(this.constructor.name).logLevel = LogLevel.DEBUG;
    LOGGER.get(this.constructor.name).info(
      this.constructor.name,
      `Getting broken links`
    );
    const fintendb: FinTenDB = await FinTenDB.getInstance();

    const linksWithErrors: VisitedLink[] = await fintendb.findVisitedLinks(
      { status: 'error' },
      { url: 1, _id: 0 }
    );

    const downloadablesWithErros: Downloadable[] = linksWithErrors.map(f => ({
      url: f.url,
      fileName: 'filing.txt'
    }));

    for (let n = 0; n < downloadablesWithErros.length; n++) {
      const percentageDownloads =
        ((n + 1) / downloadablesWithErros.length) * 100;
      LOGGER.get(this.constructor.name).info(
        this.constructor.name,
        `🛎 ${n + 1}/${
          downloadablesWithErros.length
        } (${percentageDownloads.toFixed(3)} %)`
      );

      const filings = await this.secgov.get(downloadablesWithErros[n]);

      for (let filing of filings) {
        try {
          const xbrl: XBRL = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await fintendb.insertFiling(xbrl.get());

          await fintendb.updateVisitedLinks(
            { url: filing.url },
            {
              status: 'ok',
              error: null,
              filingId: result.insertedId
            }
          );

          LOGGER.get(this.constructor.name).info(
            this.constructor.name,
            `Could now parse from ${filing.url}!`
          );
        } catch (ex) {
          LOGGER.get(this.constructor.name).info(
            this.constructor.name,
            `Could still not parse from ${filing.url}`
          );
        }
      }
      this.secgov.flush();
    }

    this.secgov.flush();
  }
}

export default FinTen;
