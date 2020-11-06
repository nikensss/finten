import FormType from '../filings/FormType';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import XBRLUtilities from '../secgov/XBRLUtilities';
import VisitedLinkModel, { VisitedLinkDocument, VisitedLinkStatus } from '../db/models/VisitedLink';
import { Schema } from 'mongoose';
import { Filing } from '../db/models/Filing';
import Downloadable from '../download/Downloadable';
import Database from '../db/Database';
import CompanyInfoModel, { CompanyInfo } from '../db/models/CompanyInfo';
import FilingMetadata from '../filings/FilingMetadata';

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

  async buildCompanyInfo(csv: string): Promise<void> {
    try {
      const companies = await CompanyInfoModel.parseFile(csv);
      await this.saveAllCompanies(companies);
    } catch (ex) {
      console.log(`Error building CompanyInfo collection: ${ex.toString()}`);
    }
  }

  private async saveAllCompanies(companies: CompanyInfo[]) {
    let counter = 1;
    for (const company of companies) {
      try {
        const doc = await this.createCompanyInfo(company);
        console.log(
          ` [${counter}] Added new CompanyInfo: ${doc.TradingSymbol} (${doc.EntityCentralIndexKey})`
        );
      } catch (ex) {
        console.log(`Error while saving all companies [${counter}! ${ex.toString()}`);
      } finally {
        counter += 1;
      }
    }
  }

  private async createCompanyInfo(companyInfo: CompanyInfo) {
    try {
      const db = await this.db.connect();
      return await db.createCompanyInfo(companyInfo);
    } catch (e) {
      throw new Error(e);
    }
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

    try {
      const filingsMetadata = await this.getFilingsMetadata(start, end);
      const total = filingsMetadata.length;

      for (
        let filingMetadata = filingsMetadata.shift();
        typeof filingMetadata !== 'undefined';
        filingMetadata = filingsMetadata.shift()
      ) {
        this.logPercentage(total - filingsMetadata.length, total);
        try {
          if (await this.isAlreadyVisited(filingMetadata)) continue;

          const filings = await this.secgov.getFilings(filingMetadata);
          await this.addFilings(filings);
        } catch (e) {
          this.logger.error(`Error while getting and adding filings: ${e.toString()}`);
        } finally {
          this.secgov.flush();
        }
      }

      this.secgov.flush();
      this.logger.info('Done filling!');
    } catch (e) {
      this.logger.error(`Could not get filings metadata: ${e.toString()}`);
    }
  }

  private async isAlreadyVisited(filingMetadata: FilingMetadata): Promise<boolean> {
    try {
      return await VisitedLinkModel.exists({ url: filingMetadata.url });
    } catch (e) {
      this.logger.error(`::isAlreadyVisited -> ${e.toString()}`);
      return true; //default to true just to avoid duplicates in the DB
    }
  }

  private async addFilings(filings: Downloadable[]) {
    this.logger.info(`adding ${filings.length} filing(s)`);
    for (const filing of filings) {
      try {
        await this.addFiling(filing);
      } catch (ex) {
        await this.handleExceptionDuringFilingCreation(filing.url, ex);
      }
    }
  }

  private async addFiling(filing: Downloadable): Promise<void> {
    this.logger.info('parsing xbrl...');
    const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
    const result = await this.createFiling(xbrl.get());
    this.logger.info('added new filing!');
    await this.createVisitedLink(filing.url, result._id);
    this.logger.info('saved visited link!');
  }

  private async getFilingsMetadata(start: number, end: number): Promise<FilingMetadata[]> {
    try {
      this.secgov.flush();
      const indices = await this.secgov.getIndices(start, end);
      const filings = this.secgov.parseIndices(indices, [FormType.F10K, FormType.F10Q]);
      this.secgov.flush();
      return filings;
    } catch (e) {
      this.logger.error(`Could not get filings metadata: ${e.toString()}`);
      return [];
    }
  }

  async retryProblematicFilings(): Promise<void> {
    this.logger.logLevel = LogLevel.DEBUG;
    try {
      this.logger.info('Getting broken links');
      const db: Database = await this.db.connect();

      const cursor = db.findVisitedLinks({ status: VisitedLinkStatus.ERROR });
      await cursor.eachAsync(async (visitedLink: VisitedLinkDocument) => {
        const downloadable: Downloadable = {
          url: visitedLink.url,
          fileName: 'filing.txt'
        };

        const filings = await this.secgov.getFilings(downloadable);

        for (const filing of filings) {
          try {
            const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
            const result = await this.createFiling(xbrl.get());
            await visitedLink.hasBeenFixed(result._id);
            await visitedLink.save();
            this.logger.info(`Could now parse from ${filing.url}!`);
          } catch (ex) {
            this.logger.info(`Could not parse from ${filing.url}. Error: ${ex}`);
          }
        }
        this.secgov.flush();
      });
      this.secgov.flush();
    } catch (e) {
      this.logger.error(`Could not retry problematic filings: ${e.toString()}`);
    }
  }

  private async createFiling(filing: Filing) {
    try {
      const db = await this.db.connect();
      return await db.createFiling(filing);
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createVisitedLink(url: string, resultId: Schema.Types.ObjectId) {
    try {
      const db = await this.db.connect();
      return await db.createVisitedLink({
        url,
        status: VisitedLinkStatus.OK,
        error: null,
        filingId: resultId
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  private async handleExceptionDuringFilingCreation(url: string, ex: Error) {
    this.logger.warning(`Error while parsing ${url}:\n${ex.toString()}`);
    const db = await this.db.connect();
    return await db.createVisitedLink({
      url,
      status: VisitedLinkStatus.ERROR,
      error: ex.toString(),
      filingId: null
    });
  }

  private get logger() {
    return LOGGER.get(this.constructor.name);
  }

  private logPercentage(currentAmount: number, length: number) {
    const percentageDownloads = ((currentAmount + 1) / length) * 100;
    this.logger.info(`🛎  ${currentAmount + 1}/${length} (${percentageDownloads.toFixed(3)} %)`);
  }
}

export default FinTen;
