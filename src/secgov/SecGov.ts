import DownloadManager from '../download/DownloadManager';
import { Quarter } from './XBRL';

class SecGov extends DownloadManager {
  public static readonly API_ROOT: string = 'https://www.sec.gov/Archives/';
  public static readonly INDICES_ROOT: string = SecGov.API_ROOT + 'edgar/full-index/';
  public static readonly MAX_API_CALLS_PER_SECOND = 10;

  constructor(downloadsDirectory: string) {
    super(downloadsDirectory, SecGov.MAX_API_CALLS_PER_SECOND);
  }

  async getIndex(year: number, quarter: Quarter) {
    const url = `${SecGov.INDICES_ROOT}/${year}/${quarter}/xbrl.idx`;
    await super.get({ url, fileName: `${year}_${quarter}_xbrl.idx` });
  }

  
}

export default SecGov;