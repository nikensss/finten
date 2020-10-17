import { promises as fs } from 'fs';
import FormType from '../filings/FormType';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import XBRLUtilities from '../secgov/XBRLUtilities';
import {
  VisitedLinkDocument,
  VisitedLinkStatus
} from '../db/models/VisitedLink';
import { Schema } from 'mongoose';
import { Filing } from '../db/models/Filing';
import Ticker from '../db/models/Ticker';
import Downloadable from '../download/Downloadable';
import Database from '../db/Database';

class FinTen {
  private _secgov: SecGov;
  private _db: Database;

  constructor(secgov: SecGov, db: Database) {
    this._secgov = secgov;
    this._db = db;
  }

  get secgov(): SecGov {
    return this._secgov;
  }

  set secgov(secgov: SecGov) {
    this._secgov = secgov;
  }

  get db(): Database {
    return this._db;
  }

  set db(db: Database) {
    this._db = db;
  }

  async buildEntityCentralIndexKeyMap(): Promise<void> {
    const tickersCIKMap = await this.secgov.getEntityCentralIndexKeyMap();

    for (const f of tickersCIKMap) {
      const content = (await fs.readFile(f.fileName, 'utf-8')).split('\n');
      const db = await this.db.connect();
      for (const line of content) {
        try {
          const ticker = Ticker.parse(line);
          await db.insertTicker(ticker);
          console.log('found: ', ticker);
        } catch (ex) {
          if (!/duplicate key/.test(ex.toString())) {
            console.error(
              'Exception caught while parsing and insrting tickers:\n' +
                ex.toString()
            );
          }
        }
      }
    }

    this.secgov.flush();
  }

  /**
   * Fill the database with the data between the start and end years (both included)
   * up to the specified amount (if specified). If no end year is given, the method
   * will fill for only the start year.
   *
   * @param start year from which to start downloading data (inclusive)
   * @param end year at which to stop downloading data (inclusive)
   */
  async addNewFilings(start: number, end: number = start): Promise<void> {
    this.logger.logLevel = LogLevel.DEBUG;

    const newFilings = await this.getNewFilingsMetaData(start, end);

    for (let n = 0; n < newFilings.length; n++) {
      this.logPercentage(n, newFilings.length);

      const filings = await this.secgov.getFilings(newFilings[n]);

      for (const filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await this.insertFiling(xbrl.get());
          await this.insertVisitedLink(filing.url, result._id);
        } catch (ex) {
          await this.handleExceptionDuringFilingInsertion(filing.url, ex);
        }
      }
      this.secgov.flush();
    }
    this.secgov.flush();
    this.logger.info('Done filling!');
  }

  private async getNewFilingsMetaData(start: number, end: number) {
    try {
      const filingReportsMetaData = await this.getFilingsMetaData(start, end);
      const db = await this.db.connect();
      const visitedLinks = await db.findVisitedLinks({});
      return filingReportsMetaData.filter(
        (f) => !visitedLinks.find((v) => v.url === f.url)
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  private async getFilingsMetaData(start: number, end: number) {
    this.secgov.flush();

    const indices = await this.secgov.getIndices(start, end);
    const filings = this.secgov.parseIndices(indices, [
      FormType.F10K,
      FormType.F10Q
    ]);
    this.secgov.flush();
    return filings;
  }

  async retryProblematicFilings(): Promise<void> {
    this.logger.logLevel = LogLevel.DEBUG;
    this.logger.info('Getting broken links');
    const db: Database = await this.db.connect();

    const problematicFilings = await this.getLinksOfProblematicFilings();

    for (let n = 0; n < problematicFilings.length; n++) {
      this.logPercentage(n, problematicFilings.length);

      const filings = await this.secgov.getFilings(problematicFilings[n]);

      for (const filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await this.insertFiling(xbrl.get());

          await db.updateVisitedLinks(
            { url: filing.url },
            {
              status: VisitedLinkStatus.OK,
              error: null,
              filingId: result._id
            }
          );

          this.logger.info(`Could now parse from ${filing.url}!`);
        } catch (ex) {
          this.logger.info(`Could not parse from ${filing.url}. Error: ${ex}`);
        }
      }
      this.secgov.flush();
    }
    this.secgov.flush();
  }

  private async getLinksOfProblematicFilings(): Promise<Downloadable[]> {
    const db = await this.db.connect();
    const linksWithErrors: VisitedLinkDocument[] = await db.findVisitedLinks(
      { status: VisitedLinkStatus.ERROR },
      'url'
    );

    return linksWithErrors.map((f) => ({
      url: f.url,
      fileName: 'filing.txt'
    }));
  }

  private async insertFiling(filing: Filing) {
    try {
      const db = await this.db.connect();
      return await db.insertFiling(filing);
    } catch (e) {
      throw new Error(e);
    }
  }

  private async insertVisitedLink(
    url: string,
    resultId: Schema.Types.ObjectId
  ) {
    try {
      const db = await this.db.connect();
      return await db.insertVisitedLink({
        url,
        status: VisitedLinkStatus.OK,
        error: null,
        filingId: resultId
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  private async handleExceptionDuringFilingInsertion(url: string, ex: Error) {
    this.logger.warning(`Error while parsing ${url}:\n${ex.toString()}`);
    const db = await this.db.connect();
    return await db.insertVisitedLink({
      url,
      status: VisitedLinkStatus.ERROR,
      error: ex.toString(),
      filingId: null
    });
  }

  private get logger() {
    return LOGGER.get(this.constructor.name);
  }

  private logPercentage(currentIndex: number, length: number) {
    const percentageDownloads = ((currentIndex + 1) / length) * 100;
    this.logger.info(
      `🛎  ${currentIndex + 1}/${length} (${percentageDownloads.toFixed(3)} %)`
    );
  }

  async fixTickers(): Promise<void> {
    console.log('getting filings...');
    const filings = await this.db.findFilings({});

    console.log(`scanning ${filings.length} filings`);

    let unknownECIKs = 0;
    let fixedFilings = 0;
    let totalDone = 0;

    for (const filing of filings) {
      const ticker = await this.db.findTicker({
        EntityCentralIndexKey: parseInt(filing.EntityCentralIndexKey)
      });

      if (!ticker) {
        console.log(
          `Skipping ${filing.EntityRegistrantName} (${filing.EntityCentralIndexKey}) (${totalDone}/${filings.length})`
        );
        unknownECIKs += 1;
        totalDone += 1;
        continue;
      }

      if (filing.TradingSymbol.toUpperCase() === ticker.TradingSymbol) {
        console.log(
          `Trading symbols match, skipping (${totalDone}/${filings.length})...`
        );
        await this.db.updateFilings(filing, {
          TradingSymbol: ticker.TradingSymbol,
          CurrentTradingSymbol: ticker.TradingSymbol
        });
        totalDone += 1;
        continue;
      }

      console.log(
        `Updating from ${filing.TradingSymbol} to ${ticker.TradingSymbol} (${totalDone}/${filings.length})`
      );
      fixedFilings += 1;
      totalDone += 1;
      await this.db.updateFilings(filing, {
        CurrentTradingSymbol: ticker.TradingSymbol
      });
    }
    console.log(`Fixed ${fixedFilings} filings`);
    console.log(`Unknown ECIKs: ${unknownECIKs}`);
    return;
  }
}

export default FinTen;
