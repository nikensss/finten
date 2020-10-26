import FormType from '../filings/FormType';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import XBRLUtilities from '../secgov/XBRLUtilities';
import { VisitedLinkDocument, VisitedLinkStatus } from '../db/models/VisitedLink';
import { Schema } from 'mongoose';
import { Filing } from '../db/models/Filing';
import Downloadable from '../download/Downloadable';
import Database from '../db/Database';
import CompanyInfoModel, { CompanyInfo } from '../db/models/CompanyInfo';

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

    const newFilings = await this.getNewFilingsMetaData(start, end);

    for (let n = 0; n < newFilings.length; n++) {
      this.logPercentage(n, newFilings.length);

      const filings = await this.secgov.getFilings(newFilings[n]);

      for (const filing of filings) {
        try {
          const xbrl = await XBRLUtilities.fromTxt(filing.fileName);
          const result = await this.createFiling(xbrl.get());
          await this.createVisitedLink(filing.url, result._id);
        } catch (ex) {
          await this.handleExceptionDuringFilingCreation(filing.url, ex);
        }
      }
      this.secgov.flush();
    }
    this.secgov.flush();
    this.logger.info('Done filling!');
  }

  private async getNewFilingsMetaData(start: number, end: number) {
    try {
      const NOT_FOUND = -1;
      const filingReportsMetaData = await this.getFilingsMetaData(start, end);
      const db = await this.db.connect();
      await db.findVisitedLinks({}).eachAsync(async (l: VisitedLinkDocument) => {
        let index = -1;
        //loop in case several filings have the same link (which would be really weird)
        do {
          index = filingReportsMetaData.findIndex((f) => f.url === l.url);
          if (index !== NOT_FOUND) {
            filingReportsMetaData.splice(index, 1);
          }
        } while (index !== -1);
      });
      return filingReportsMetaData;
    } catch (e) {
      throw new Error(e);
    }
  }

  private async getFilingsMetaData(start: number, end: number) {
    this.secgov.flush();

    const indices = await this.secgov.getIndices(start, end); //?
    const filings = this.secgov.parseIndices(indices, [FormType.F10K, FormType.F10Q]);
    this.secgov.flush();
    return filings;
  }

  async retryProblematicFilings(): Promise<void> {
    this.logger.logLevel = LogLevel.DEBUG;
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

  private logPercentage(currentIndex: number, length: number) {
    const percentageDownloads = ((currentIndex + 1) / length) * 100;
    this.logger.info(`🛎  ${currentIndex + 1}/${length} (${percentageDownloads.toFixed(3)} %)`);
  }
}

export default FinTen;
