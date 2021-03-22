import FormType from '../filings/FormType.enum';
import SecGov from '../secgov/SecGov';
import { default as LOGGER } from '../logger/DefaultLogger';
import { LogLevel } from '../logger/LogLevel';
import XBRLUtilities from '../xbrl/XBRLUtilities';
import VisitedLinkModel, { VisitedLinkDocument, VisitedLinkStatus } from '../db/models/VisitedLink';
import { Schema } from 'mongoose';
import { Filing } from '../db/models/Filing';
import Downloadable from '../download/Downloadable.interface';
import Database from '../db/Database.interface';
import CompanyInfoModel, { CompanyInfo } from '../db/models/CompanyInfo';
import FilingModel from '../db/models/Filing';
import FilingMetadata from '../filings/FilingMetadata';
import Macro, { getMacroCollection } from '../fred/Macro.enum';
import Fred from '../fred/Fred';
import { Logger } from '../logger/Logger.interface';

/**
 * The FinTen class is the basic driver that builds FinTen. It is the interface
 * between our database, the sec.gov API, and our own API.
 *
 * The main responsibility of this class is to keep the database updated.
 */
class FinTen {
  private _secgov: SecGov;
  private _db: Database;
  private logger: Logger = LOGGER.get(this.constructor.name);

  constructor(secgov: SecGov = new SecGov(), db: Database) {
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
      this.logger.error(`Error building CompanyInfo collection: ${ex.toString()}`);
    }
  }

  private async saveAllCompanies(companies: CompanyInfo[]) {
    let counter = 1;
    for (const company of companies) {
      try {
        const doc = await this.createCompanyInfo(company);
        this.logger.info(
          ` [${counter}] Added new CompanyInfo: ${doc.TradingSymbol} (${doc.EntityCentralIndexKey})`
        );
      } catch (ex) {
        this.logger.error(`Error while saving all companies [${counter}! ${ex.toString()}`);
      } finally {
        counter += 1;
      }
    }
  }

  private async createCompanyInfo(companyInfo: CompanyInfo) {
    try {
      return await new CompanyInfoModel(companyInfo).save();
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Adds the given macro data to the database. Doesn't add duplicates or
   * non-numeric values (that is the responsibility of the Schema to make sure
   * the data has the proper type and format).
   *
   * @param macro Macro The Macro to add to the database
   */
  async addMacro(macro: Macro): Promise<void> {
    const fred = new Fred();

    try {
      //query the FRED API through our wrapper (aka, the Fred class)
      const data = await fred.getMacro(macro);

      //go through each observation in the observations array and log info
      for (let index = 0; index < data.observations.length; index++) {
        this.logPercentage(index + 1, data.observations.length);
        const observation = data.observations[index];
        try {
          //get the corresponding collection for the data of this macro
          const MacroCollection = getMacroCollection(macro);
          const doc = new MacroCollection(observation);
          await doc.save();
        } catch (ex) {
          //if the error talks about duplicate keys in the data field, ignore it
          //otherwise log it
          if (!/duplicate key error.*index: date/.test(ex.toString())) {
            this.logger.error('[when saving to collection]', ex.toString());
          }
        }
      }
    } catch (ex) {
      this.logger.error(ex);
    } finally {
      this.logger.info(`finished adding ${macro} macro information`);
    }
  }

  /**
   * Fill the database with the data between the start and end years (both
   * included). If no end year is given, the method will fill for only the start
   * year.
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

          const filing = await this.secgov.getFiling(filingMetadata);
          await this.addFiling(filing);
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
      await this.db.connect();
      const result = await VisitedLinkModel.exists({ url: filingMetadata.url });
      return result;
    } catch (e) {
      this.logger.error(`::isAlreadyVisited -> ${e.toString()}`);
      return true; //default to true just to avoid duplicates in the DB
    }
  }

  private async addFiling(filing: Downloadable): Promise<void> {
    try {
      this.logger.info('parsing xbrl...');
      const xbrl = await XBRLUtilities.fromFile(filing.fileName);
      const result = await this.createFiling(xbrl.get());
      this.logger.info('added new filing!');
      await this.createVisitedLink(filing.url, result._id);
      this.logger.info('saved visited link!');
    } catch (ex) {
      await this.handleExceptionDuringFilingCreation(filing.url, ex);
    }
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
      const cursor = VisitedLinkModel.find({ status: VisitedLinkStatus.ERROR }).cursor();
      await cursor.eachAsync(async (visitedLink: VisitedLinkDocument | VisitedLinkDocument[]) => {
        if (Array.isArray(visitedLink)) {
          for (const l of visitedLink) {
            await this.revisitLink(l);
          }
        } else {
          await this.revisitLink(visitedLink);
        }
        this.secgov.flush();
      });
      this.secgov.flush();
    } catch (e) {
      this.logger.error(`Could not retry problematic filings: ${e.toString()}`);
    }
  }

  private async revisitLink(visitedLink: VisitedLinkDocument) {
    const downloadable: Downloadable = {
      url: visitedLink.url,
      fileName: 'filing.txt'
    };

    try {
      const filing = await this.secgov.getFiling(downloadable);
      const xbrl = await XBRLUtilities.fromFile(filing.fileName);
      const result = await this.createFiling(xbrl.get());
      await visitedLink.hasBeenFixed(result._id);
      await visitedLink.save();
      this.logger.info(`Could now parse from ${filing.url}!`);
    } catch (ex) {
      this.logger.info(`Could not parse from ${downloadable.url}. Error: ${ex}`);
    }
  }

  private async createFiling(filing: Filing) {
    try {
      return await new FilingModel(filing).save();
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createVisitedLink(url: string, resultId: Schema.Types.ObjectId) {
    try {
      return await new VisitedLinkModel({
        url,
        status: VisitedLinkStatus.OK,
        error: null,
        filingId: resultId
      }).save();
    } catch (e) {
      throw new Error(e);
    }
  }

  private async handleExceptionDuringFilingCreation(url: string, ex: Error) {
    this.logger.warning(`Error while parsing ${url}:\n${ex.toString()}`);
    return await new VisitedLinkModel({
      url,
      status: VisitedLinkStatus.ERROR,
      error: ex.toString(),
      filingId: null
    }).save();
  }

  private logPercentage(currentAmount: number, length: number) {
    const percentageDownloads = (currentAmount / length) * 100;
    this.logger.info(`🛎  ${currentAmount}/${length} (${percentageDownloads.toFixed(3)} %)`);
  }
}

export default FinTen;
