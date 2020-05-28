import dotenv from 'dotenv';
import XBRL, { Quarter } from './secgov/XBRL';
import FormType from './filings/FormType';
import ParseXbrl from 'parse-xbrl';
import chalk from 'chalk';
import SecGov from './secgov/SecGov';

class FinTen {
  private secgov: SecGov;
  private xbrl: XBRL;

  constructor(downloadsDirectory: string) {
    this.secgov = new SecGov(downloadsDirectory);
    this.xbrl = new XBRL();
  }

  public static async main(): Promise<void> {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }

    const finten = new FinTen(process.env.DOWNLOADS_DIRECTORY);

    await finten.secgov.getIndex(2017, Quarter.QTR2);
    // await finten.secgov.getIndex(2017, Quarter.QTR3);
    // await finten.secgov.getIndex(2018, Quarter.QTR1);
    
    let filings = finten.xbrl.parseIndices(finten.secgov.listDownloads('.idx'), FormType.F10K, 10);

    await finten.secgov.get(...filings);
    FinTen.log('all downloads finished!');

    let xmls = finten.xbrl.parseTxts(finten.secgov.listDownloads('.txt'));
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
