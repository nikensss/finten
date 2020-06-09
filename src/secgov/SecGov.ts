import DownloadManager from '../download/DownloadManager';
import { Quarter } from './XBRL';
import TimedQueue from '../download/queues/TimedQueue';
import fs, { PathLike } from 'fs';
import FilingReportMetadata from '../filings/FilingReportMetadata';
import FormType from '../filings/FormType';
import DefaultLogger from '../logger/DefaultLogger';

class SecGov extends DownloadManager {
  public static readonly API_ROOT: string = 'https://www.sec.gov/Archives/';
  public static readonly INDICES_ROOT: string =
    SecGov.API_ROOT + 'edgar/full-index/';
  /**
   * The amount of milliseconds between to API calls
   */
  public static readonly MS_BETWEEN_REQUESTS = 100; //their documentation says max 10 API calls per second

  constructor(downloadsDirectory: string) {
    super(downloadsDirectory);
    super.use(new TimedQueue(SecGov.MS_BETWEEN_REQUESTS));
  }

  async getIndex(year: number, quarter: Quarter) {
    const url = `${SecGov.INDICES_ROOT}/${year}/${quarter}/xbrl.idx`;
    await super.get({ url, fileName: `${year}_${quarter}_xbrl.idx` });
  }

  async getIndices(start: number, end: number = start) {
    if (start > end) throw new Error('start > end 🤯');

    for (let year = start; year <= end; year++) {
      await this.getIndex(year, Quarter.QTR1);
      await this.getIndex(year, Quarter.QTR2);
      await this.getIndex(year, Quarter.QTR3);
      await this.getIndex(year, Quarter.QTR4);
    }
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
    formType: FormType,
    amount?: number
  ): FilingReportMetadata[] {
    DefaultLogger.get(this.constructor.name).debug(
      this.constructor.name,
      `parsing idx: ${path}`
    );
    let lines = fs.readFileSync(path, 'utf8').split('\n');
    return lines
      .reduce((t, c) => {
        try {
          const frm = new FilingReportMetadata(c);
          if (frm.formType === formType) t.push(frm);
        } catch (ex) {
          if (!ex.message.includes('Unknown filing type')) {
            DefaultLogger.get(this.constructor.name).error(
              this.constructor.name,
              ex
            );
          }
        }
        return t;
      }, [] as FilingReportMetadata[])
      .slice(0, amount);
  }

  parseIndices(formType: FormType, amount?: number): FilingReportMetadata[] {
    return this.listDownloads('.idx')
      .map(p => this.parseIndex(p, formType))
      .flat()
      .slice(0, amount);
  }
}

export default SecGov;
