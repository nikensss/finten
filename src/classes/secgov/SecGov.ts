import DownloadManager from '../download/DownloadManager';
import { Quarter } from './XBRL';
import TimedQueue from '../download/queues/TimedQueue';
import fs, { PathLike } from 'fs';
import FilingMetadata from '../filings/FilingMetadata';
import FormType from '../filings/FormType';
import { default as LOGGER } from '../logger/DefaultLogger';
import Downloadable from '../download/Downloadable';

class SecGov extends DownloadManager {
  public static readonly API_ROOT: string = 'https://www.sec.gov/Archives/';
  public static readonly INDICES_ROOT: string =
    SecGov.API_ROOT + 'edgar/full-index/';
  /**
   * The amount of milliseconds between to API calls
   */
  public static readonly MS_BETWEEN_REQUESTS = 100; //their documentation says max 10 API calls per second

  constructor(downloadsDirectory?: string) {
    super(downloadsDirectory);
    super.use(new TimedQueue(SecGov.MS_BETWEEN_REQUESTS));
  }

  async getIndex(year: number, quarter: Quarter): Promise<Downloadable[]> {
    const url = `${SecGov.INDICES_ROOT}/${year}/${quarter}/xbrl.idx`;
    return await super.get({ url, fileName: `${year}_${quarter}_xbrl.idx` });
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

    const downloadedIndices = [];
    for (let year = start; year <= end; year++) {
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR1)));
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR2)));
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR3)));
      downloadedIndices.push(...(await this.getIndex(year, Quarter.QTR4)));
    }
    return downloadedIndices;
  }

  /**
   * Parses all .idx files in the 'downloads' folder and returns the
   * FilingReportMetadata's that correspond to the desired form type.
   *
   * @param formType Form type to look for
   * @param amount The amount of filings to return
   */
  parseIndex(
    path: PathLike,
    formType: FormType[],
    amount?: number
  ): FilingMetadata[] {
    LOGGER.get(this.constructor.name).debug(`parsing idx: ${path}`);
    const lines = fs.readFileSync(path, 'utf8').split('\n');
    return lines
      .reduce((t, c) => {
        try {
          const filingMetadata = new FilingMetadata(c); //map
          if (formType.includes(filingMetadata.formType)) {
            t.push(filingMetadata); //filter
          }
        } catch (ex) {
          if (!ex.message.includes('Unknown filing type')) {
            LOGGER.get(this.constructor.name).error(ex);
          }
        }
        return t;
      }, [] as FilingMetadata[])
      .slice(0, amount);
  }

  parseIndices(
    indices: Downloadable[],
    formType: FormType[],
    amount?: number
  ): FilingMetadata[] {
    return indices
      .map((index) => this.parseIndex(index.fileName, formType))
      .flat()
      .slice(0, amount);
  }
}

export default SecGov;
