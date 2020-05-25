import dotenv from 'dotenv';
import DownloadManager from './download/DownloadManager';
import XBRL, { Quarter } from './XBRL';
import FormType from './filings/FormType';
import ParseXbrl from 'parse-xbrl';
import chalk from 'chalk';
import Downloadable from './download/Downloadable';

class FinTen {
  private dm: DownloadManager;
  private xbrl: XBRL;

  constructor(downloadsDirectory: string) {
    this.dm = new DownloadManager(downloadsDirectory, 10);
    this.xbrl = new XBRL(this.dm);
  }

  public static async main(): Promise<void> {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }

    const finten = new FinTen(process.env.DOWNLOADS_DIRECTORY);

    await finten.xbrl.getIndex(2017, Quarter.QTR2);
    // await finten.xbrl.getIndex(2017, Quarter.QTR3);
    // await finten.xbrl.getIndex(2018, Quarter.QTR1);

    let filings = await finten.xbrl.parseIndex(FormType.F10K);
    //add all the 10-K filings to the download queue
    finten.dm.queue(...filings);
    //download them as fast as possible
    await finten.dm.unqueue();
    FinTen.log('all downloads finished!');

    let xmls = await finten.xbrl.parseTxt();
    for (let xml of xmls) {
      FinTen.log(`Parsing: ${xml.name}`);
      //const parsedXml = await ParseXbrl.parseStr(xml.xml);
      //FinTen.log('Result: ', parsedXml);
    }
  }

  private static log(...args: string[]): void {
    console.log.apply(null, [chalk.bgCyan(`[FinTen] `), ...args]);
  }
}

export default FinTen;
