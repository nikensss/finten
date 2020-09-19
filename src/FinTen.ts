import XBRL from './classes/secgov/XBRL';
import FormType from './classes/filings/FormType';
import FinTenDB from './classes/db/FinTenDB';
import SecGov from './classes/secgov/SecGov';
import { default as LOGGER } from './classes/logger/DefaultLogger';
import { LogLevel } from './classes/logger/LogLevel';
import FinTenAPI from './FinTenAPI';
import Downloadable from './classes/download/Downloadable';

class FinTen {
  private downloadsDirectory: string;

  constructor(downloadsDirectory: string) {
    this.downloadsDirectory = downloadsDirectory;
  }

  public static asAPI() {
    const fintenAPI = new FinTenAPI();
    fintenAPI.setRoutes().listen();
  }

  public static create(): FinTen {
    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }
    return new FinTen(process.env.DOWNLOADS_DIRECTORY);
  }

  public async fill(start: number, end?: number, amount?: number) {
    LOGGER.get(this.constructor.name).logLevel = LogLevel.DEBUG;

    const secgov = new SecGov(this.downloadsDirectory);
    secgov.flush();

    await secgov.getIndices(start, end);
    let filings = secgov.parseIndices([FormType.F10K, FormType.F10Q], amount);

    LOGGER.get(this.constructor.name).info(
      this.constructor.name,
      `found ${filings.length} 10-K or 10-Q filings`
    );

    secgov.flush();
    let downloadedDownloadables: Downloadable[] = [];
    let xbrl: XBRL;

    type VisitedLink = {
      url: string;
      status: string;
      error: string | null;
    };

    const fintendb: FinTenDB = await FinTenDB.getInstance();

    let visitedLinks: VisitedLink[] = await fintendb.findVisitedLinks(
      {},
      { url: 1, _id: 0 }
    );

    for (let filing of filings) {
      if (visitedLinks.some(v => v.url.includes(filing.url))) {
        LOGGER.get(this.constructor.name).info(
          this.constructor.name,
          'skipping download'
        );
        continue;
      }

      downloadedDownloadables = await secgov.get(filing);
      for (let downloadedDownloadable of downloadedDownloadables) {
        try {
          xbrl = await XBRL.fromTxt(downloadedDownloadable.fileName);

          //FIXME:
          //the XBRL class is a wrapper around the actual XBRL data. We should
          //only add the XBRL data, thus do 'xbrl.get()' when adding data to the
          //database.
          await fintendb.insertFiling(xbrl.get());

          await fintendb.insertVisitedLink({
            url: downloadedDownloadable.url,
            status: 'ok',
            error: null
          });
        } catch (ex) {
          LOGGER.get(this.constructor.name).warning(
            this.constructor.name,
            `Error while parsing txt to XBRL at ${downloadedDownloadable}:\n${ex}`
          );

          await fintendb.insertVisitedLink({
            url: downloadedDownloadable.url,
            status: 'error',
            error: ex.toString()
          });
        }
      }
      secgov.flush();
    }

    secgov.flush();
  }

  /**
   * @deprecated Use API to interact with FinTen
   */
  public static async main(): Promise<void> {
    const finten = FinTen.create();

    finten.fill(2018, 2019, 4);
  }
}

export default FinTen;
