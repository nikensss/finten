// De la llista temporal obtinguida de IndexParser.ts, rep el cik i l'altre numero, fa get de la seguent url:
// https://www.sec.gov/Archives/edgar/data/{CIK}/{altre-numero}-xbrl.zip
//https://www.sec.gov/Archives/edgar/full-index/2019/QTR1
import { promises as fs } from 'fs';
import path from 'path';
import DownloadManager from './download/DownloadManager';
import chalk from 'chalk';
import FormType from './filings/FormType';
import FilingReportMetadata from './filings/FilingReportMetadata';

class XBRL {
  private _dm: DownloadManager;
  constructor(dowloadManager: DownloadManager) {
    this._dm = dowloadManager;
  }

  async getIndex(year: number, quarter: Quarter) {
    const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/${quarter}/xbrl.idx`;
    await this._dm.get(url, `${year}_${quarter}_xbrl.idx`);
  }

  async parseIndex(filing: FormType): Promise<FilingReportMetadata[]> {
    const filings: FilingReportMetadata[] = [];

    for (let file of this._dm.listDownloads()) {
      this.log(file.toString());
      let lines = (await fs.readFile(path.join(this._dm.dir.toString(), file.toString()), 'utf8')).split('\n');
      filings.push(...lines.map((x) => new FilingReportMetadata(x)).filter((x) => x.formType === filing));
    }

    return filings;
  }

  private log(msg: string) {
    console.log(chalk.green(`[XBRL] ${msg}`));
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
