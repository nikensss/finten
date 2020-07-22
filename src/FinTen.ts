import dotenv from 'dotenv';
import XBRL from './classes/secgov/XBRL';
import FormType from './classes/filings/FormType';
import FinTenDB, { fintendb } from './classes/db/FinTenDB';
import SecGov from './classes/secgov/SecGov';
import { default as LOGGER } from './classes/logger/DefaultLogger';
import { LogLevel } from './classes/logger/LogLevel';
import FinTenAPI from './FinTenAPI';

class FinTen {
  private downloadsDirectory: string;

  constructor(downloadsDirectory: string) {
    this.downloadsDirectory = downloadsDirectory;
  }

  public static asAPI() {
    const fintenAPI = new FinTenAPI();
    fintenAPI.setRoutes().listen();
  }

  public static create(): FinTen {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }
    return new FinTen(process.env.DOWNLOADS_DIRECTORY);
  }

  public async fill(start: number, end?: number, amount?: number) {
    LOGGER.get(this.constructor.name).logLevel = LogLevel.DEBUG;

    const secgov = new SecGov(this.downloadsDirectory);
    secgov.flush();

    await secgov.getIndices(start, end);
    let filings = secgov.parseIndices([FormType.F10K, FormType.F10Q], amount);

    LOGGER.get(this.constructor.name).info(
      this.constructor.name,
      `found ${filings.length} 10-K or 10-Q filings`
    );

    secgov.flush();
    let txts: string[] = [];
    let xbrl: XBRL;

    let partialPaths: string[] = (
      await fintendb.find({
        query: {
          $select: ['partialPath']
        }
      })
    ).map((p: any) => p.partialPath);

    for (let filing of filings) {
      if (partialPaths.includes(filing.partialPath)) {
        LOGGER.get(this.constructor.name).info(
          this.constructor.name,
          'skipping download (already in db)'
        );
        continue;
      }

      txts = await secgov.get(filing);
      for (let txt of txts) {
        try {
          xbrl = await XBRL.fromTxt(txt);
          xbrl.partialPath = filing.partialPath;
          await fintendb.create(xbrl);
        } catch (ex) {
          LOGGER.get(this.constructor.name).warning(
            this.constructor.name,
            `Error while parsing txt to XBRL at ${txt}:\n${ex}`
          );
        } finally {
          secgov.flush();
        }
      }
    }

    secgov.flush();
  }

  public static async main(): Promise<void> {
    const finten = FinTen.create();

    finten.fill(2018, 2019, 4);
  }
}

export default FinTen;
