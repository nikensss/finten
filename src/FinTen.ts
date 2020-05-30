import dotenv from 'dotenv';
import XBRL, { Quarter } from './secgov/XBRL';
import FormType from './filings/FormType';
import chalk from 'chalk';
import FinTenDB from './db/FinTenDB';
import SecGov from './secgov/SecGov';

class FinTen {
  private secgov: SecGov;
  private xbrl: XBRL;
  private db: FinTenDB;

  constructor(downloadsDirectory: string) {
    this.secgov = new SecGov(downloadsDirectory);
    this.xbrl = new XBRL();
    this.db = new FinTenDB();
  }

  public static async main(): Promise<void> {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }

    const finten = new FinTen(process.env.DOWNLOADS_DIRECTORY);

    await finten.secgov.getIndex(2017, Quarter.QTR2);
    await finten.secgov.getIndex(2017, Quarter.QTR3);
    await finten.secgov.getIndex(2018, Quarter.QTR1);

    let filings = finten.xbrl.parseIndices(finten.secgov.listDownloads('.idx'), FormType.F10K);

    await finten.secgov.get(...filings);
    FinTen.log('all downloads finished!');

    let xmls = finten.xbrl.parseTxts(finten.secgov.listDownloads('.txt'));
    for (let xml of xmls) {
      FinTen.log(`Parsing: ${xml.name}`);
      try {
        const parsedXml = await finten.xbrl.parseXBRL(xml.xml);
        await finten.db.create(parsedXml);
      } catch (ex) {
        this.exception(ex);
      }
    }

    finten.secgov.flush();
  }

  public static log(...args: any[]): void {
    console.log.apply(null, [chalk.bgCyan(`[FinTen] ${args[0]}`), ...args.slice(1)]);
    //const parsedXml = await ParseXbrl.parseStr(xml.xml);
    //FinTen.log('Result: ', parsedXml);
  }

  public static exception(...args: any[]) {
    console.log.apply(null, [chalk.bgRed(`[FinTen] {EXCEPTION}`), ...args]);
  }
}

export default FinTen;
