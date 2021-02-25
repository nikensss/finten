import { Quarter } from '../xbrl/XBRL';
import TimedQueue from '../download/queues/TimedQueue';
import fs, { PathLike } from 'fs';
import FilingMetadata from '../filings/FilingMetadata';
import FormType from '../filings/FormType.enum';
import { default as LOGGER } from '../logger/DefaultLogger';
import Downloadable from '../download/Downloadable.interface';
import Downloader from '../download/Downloader.interface';
import DownloadManager from '../download/DownloadManager';
import { Logger } from '../logger/Logger.interface';

/**
 * The SecGov class is a wrapper around the SecGov API so that filings can be
 * downloaded respecting the limitations on usage.
 *
 * In order to get new filings, first call the getIndex(...) (getIndices(...))
 * method, then parse the returned value using parseIndex(...)
 * (parseIndices(...)) method. Finally, pass the result of this last call to the
 * getFilings(...) method.
 */
class SecGov {
  public static readonly INDICES_ROOT = 'https://www.sec.gov/Archives/edgar/full-index/';
  public static readonly FILINGS_ROOT = 'https://www.sec.gov/Archives/';
  public static readonly ECIK_MAP_URL = 'https://www.sec.gov/include/ticker.txt';

  private dm: Downloader<Downloadable>;
  /**
   * The amount of milliseconds between to API calls. SecGov has a limit of 10
   * calls per second.
   */
  public static readonly MS_BETWEEN_REQUESTS = 100;
  private logger: Logger = LOGGER.get(this.constructor.name);

  constructor(dm: Downloader<Downloadable> = new DownloadManager()) {
    if (!dm) {
      throw new TypeError('Please, provide a valid Downloader');
    }
    this.dm = dm;
    this.dm.use(new TimedQueue<Downloadable>(SecGov.MS_BETWEEN_REQUESTS));
  }

  /**
   * Downloads all the .idx files available between the specified period of time.
   *
   * @param start the year from which to start downloading the .idx files (inclusive)
   * @param end the year at which to stop downloading the .idx files (inclusive)
   */
  async getIndices(start: number, end: number = start): Promise<Downloadable[]> {
    if (start > end) throw new Error('start > end 🤯');

    const downloadedIndices: Downloadable[] = [];
    for (let year = start; year <= end; year++) {
      downloadedIndices.push(await this.getIndex(year, Quarter.QTR1));
      downloadedIndices.push(await this.getIndex(year, Quarter.QTR2));
      downloadedIndices.push(await this.getIndex(year, Quarter.QTR3));
      downloadedIndices.push(await this.getIndex(year, Quarter.QTR4));
    }

    return downloadedIndices;
  }

  async getIndex(year: number, quarter: Quarter): Promise<Downloadable> {
    const url = `${SecGov.INDICES_ROOT}/${year}/${quarter}/xbrl.idx`;
    return await this.dm.get({ url, fileName: `${year}_${quarter}_xbrl.idx` });
  }

  /**
   * Parses all the files in the indices array as if they were xbrl.idx files.
   *
   * @param indices the files to parse
   * @param formType the desired form types to retrieve
   */
  parseIndices(indices: Downloadable[], formType: FormType[]): FilingMetadata[] {
    return indices.map((index) => this.parseIndex(index.fileName, formType)).flat();
  }

  /**
   * Parses the given file as if it was an xbrl.idx file from SecGov.
   *
   * @param formTypes Form type to look for
   * @param amount The amount of filings to return
   */
  parseIndex(path: PathLike, formTypes: FormType[]): FilingMetadata[] {
    this.logger.debug(`parsing idx: ${path}`);

    const lines = fs.readFileSync(path, 'utf8').split('\n');
    return lines.reduce((t, c) => {
      try {
        const filingMetadata = new FilingMetadata(c); //map
        if (formTypes.includes(filingMetadata.formType)) {
          t.push(filingMetadata); //filter
        }
      } catch (ex) {
        if (!ex.message.includes('Unknown filing type')) {
          this.logger.error(ex);
        }
      }
      return t;
    }, [] as FilingMetadata[]);
  }

  async getEntityCentralIndexKeyMap(): Promise<Downloadable> {
    this.flush();
    return await this.dm.get({
      url: SecGov.ECIK_MAP_URL,
      fileName: 'ticker_ecik_map.txt'
    });
  }

  async getFilings(...downloadables: Downloadable[]): Promise<Downloadable[]> {
    const filings = [];
    for (const downloadable of downloadables) {
      filings.push(await this.getFiling(downloadable));
    }

    return filings;
  }

  async getFiling(downloadable: Downloadable): Promise<Downloadable> {
    return await this.dm.get(downloadable);
  }

  flush(): void {
    this.dm.flush();
  }
}

export default SecGov;
