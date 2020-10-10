import { Quarter } from './XBRL';
import TimedQueue from '../download/queues/TimedQueue';
import fs, { PathLike } from 'fs';
import FilingMetadata from '../filings/FilingMetadata';
import FormType from '../filings/FormType';
import { default as LOGGER } from '../logger/DefaultLogger';
import Downloadable from '../download/Downloadable';
import Downloader from '../download/Downloader';

class SecGov {
  public static readonly INDICES_ROOT =
    'https://www.sec.gov/Archives/edgar/full-index/';
  private dm: Downloader;
  /**
   * The amount of milliseconds between to API calls. SecGov has a limit of 10
   * calls per second.
   */
  public static readonly MS_BETWEEN_REQUESTS = 100;

  constructor(dm: Downloader) {
    this.dm = dm;
    this.dm.use(new TimedQueue(SecGov.MS_BETWEEN_REQUESTS));
  }

  /**
   * Downloads all the .idx files available between the specified period of time.
   *
   * @param start the year from which to start downloading the .idx files (inlcusive)
   * @param end the year at which to stop downloading the .idx files (inlcusive)
   */
  async getIndices(
    start: number,
    end: number = start
  ): Promise<Downloadable[]> {
    if (start > end) throw new Error('start > end 🤯');

    const downloadedIndices: Downloadable[] = [];
    for (let year = start; year <= end; year++) {
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR1)));
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR2)));
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR3)));
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR4)));
    }

    return downloadedIndices;
  }

  async getIndex(year: number, quarter: Quarter): Promise<Downloadable[]> {
    const url = `${SecGov.INDICES_ROOT}/${year}/${quarter}/xbrl.idx`;
    return await this.dm.get({ url, fileName: `${year}_${quarter}_xbrl.idx` });
  }

  parseIndices(
    indices: Downloadable[],
    formType: FormType[]
  ): FilingMetadata[] {
    return indices
      .map((index) => this.parseIndex(index.fileName, formType))
      .flat();
  }

  /**
   * Parses all .idx files in the 'downloads' folder and returns the
   * FilingReportMetadata's that correspond to the desired form type.
   *
   * @param formTypes Form type to look for
   * @param amount The amount of filings to return
   */
  parseIndex(path: PathLike, formTypes: FormType[]): FilingMetadata[] {
    LOGGER.get(this.constructor.name).debug(`parsing idx: ${path}`);

    const lines = fs.readFileSync(path, 'utf8').split('\n');
    return lines.reduce((t, c) => {
      try {
        const filingMetadata = new FilingMetadata(c); //map
        if (formTypes.includes(filingMetadata.formType)) {
          t.push(filingMetadata); //filter
        }
      } catch (ex) {
        if (!ex.message.includes('Unknown filing type')) {
          LOGGER.get(this.constructor.name).error(ex);
        }
      }
      return t;
    }, [] as FilingMetadata[]);
  }

  async getEntityCentralIndexKeyMap(): Promise<Downloadable[]> {
    return await this.dm.get({
      url: 'https://www.sec.gov/include/ticker.txt',
      fileName: 'ticker_ecik_map.txt'
    });
  }

  async getFilings(...downloadables: Downloadable[]): Promise<Downloadable[]> {
    return await this.dm.get(...downloadables);
  }

  flush(): void {
    this.dm.flush();
  }
}

export default SecGov;
