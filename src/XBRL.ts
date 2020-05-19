// De la llista temporal obtinguida de IndexParser.ts, rep el cik i l'altre numero, fa get de la seguent url:
// https://www.sec.gov/Archives/edgar/data/{CIK}/{altre-numero}-xbrl.zip
//https://www.sec.gov/Archives/edgar/full-index/2019/QTR1

import DownloadManager from './download/DownloadManager';
import chalk from 'chalk';

class XBRL {
  private _dm: DownloadManager;
  constructor(dowloadManager: DownloadManager) {
    this._dm = dowloadManager;
  }

  async getIndex(year: number, quarter: Quarter) {
    const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/${quarter}/xbrl.idx`;
    await this._dm.get(url, `${year}_${quarter}__xbrl.idx`);
  }

  parseIndex(filing: Filing) {
    for (let file of this._dm.listDownloads()) {
      this.log(file.toString());
    }
  }

  private log(msg: string) {
    console.log(chalk.green(`[XBRL] ${msg}`));
  }
}

export default XBRL;

export const enum Filing {
  F10K = '10-K',
  F8K = '8-K'
}
export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
