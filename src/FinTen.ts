import dotenv from 'dotenv';
import DownloadManager from './download/DownloadManager';
import XBRL, { Quarter } from './XBRL';
import FormType from './filings/FormType';
import ParseXbrl from 'parse-xbrl';
import chalk from 'chalk';
import FinTenDB from './db/FinTenDB';

class FinTen {
  private dm: DownloadManager;
  private xbrl: XBRL;
  private db: FinTenDB;

  constructor(downloadsDirectory: string) {
    this.dm = new DownloadManager(downloadsDirectory);
    this.xbrl = new XBRL(this.dm);
    this.db = new FinTenDB();
  }

  public static async main(): Promise<void> {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }

    const finten = new FinTen(process.env.DOWNLOADS_DIRECTORY);

    // await finten.xbrl.getIndex(2008, Quarter.QTR1);
    // await finten.xbrl.getIndex(2008, Quarter.QTR2);
    // await finten.xbrl.getIndex(2008, Quarter.QTR3);

    // let filings = await finten.xbrl.parseIndex(FormType.F10K);
    // await Promise.all(filings.map((f) => finten.dm.get(f.fullPath, f.fileName)));

    let xmls = await finten.xbrl.parseTxt();
    for (let xml of xmls) {
      FinTen.log(`Parsing: ${xml.name}`);
      try {
        const parsedXml = await ParseXbrl.parseStr(xml.xml);
        await finten.db.create(parsedXml);
      } catch (ex) {
        this.exception(ex);
      }
    }
  }

  public static log(...args: any[]): void {
    console.log.apply(null, [chalk.bgCyan(`[FinTen] ${args[0]}`), ...args.slice(1)]);
  }

  public static exception(...args: any[]) {
    console.log.apply(null, [chalk.bgRed(`[FinTen] {EXCEPTION}`), ...args]);
  }
}

export default FinTen;
