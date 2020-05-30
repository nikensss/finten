import DownloadManager from '../download/DownloadManager';
import { Quarter } from './XBRL';
import TimedQueue from '../download/queues/TimedQueue';

class SecGov extends DownloadManager {
  public static readonly API_ROOT: string = 'https://www.sec.gov/Archives/';
  public static readonly INDICES_ROOT: string = SecGov.API_ROOT + 'edgar/full-index/';
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
}

export default SecGov;
