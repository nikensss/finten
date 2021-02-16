import mongoose, { Mongoose } from 'mongoose';
import Database from './Database.interface';
import { default as LOGGER } from '../logger/DefaultLogger';
import { Logger } from '../logger/Logger.interface';
import FilingModel, { FilingDocument } from './models/Filing';
import CompanyInfoModel, { CompanyInfoDocument } from './models/CompanyInfo';

class FinTenDB implements Database {
  private static instance: FinTenDB | null = null;
  private client: Mongoose = mongoose;
  private logger: Logger = LOGGER.get(this.constructor.name);

  static getInstance(): FinTenDB {
    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
    }

    return FinTenDB.instance;
  }

  async connect(uri?: string): Promise<Database> {
    if (this.isConnected()) {
      return this;
    }

    try {
      this.logger.info('connecting...');
      await this.client.connect(uri || FinTenDB.URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        autoIndex: true,
        useFindAndModify: false,
        keepAlive: true,
        keepAliveInitialDelay: 300000
      });
      this.logger.info('Database connected!');

      return this;
    } catch (ex) {
      this.logger.error('Could not connect to DB: ' + ex.toString());
      throw new Error('Could not connect to DB: ' + ex.toString());
    }
  }

  async disconnect(): Promise<void> {
    return await this.client.disconnect();
  }

  public isConnected(): boolean {
    return this.client.connection.readyState === this.client.connection.states.connected;
  }

  private static get URI(): string {
    if (!process.env.DB_NAME) {
      throw new Error('No database has been provided!');
    }

    if (!process.env.MONGODB_USER) {
      throw new Error('No user defined for MongoDB connection!');
    }
    if (!process.env.MONGODB_PASS) {
      throw new Error('No password defined for MongoDB connection!');
    }

    return (
      'mongodb+srv://' +
      process.env.MONGODB_USER +
      ':' +
      process.env.MONGODB_PASS +
      '@dev-cluster.vvwni.gcp.mongodb.net/' +
      process.env.DB_NAME +
      '?retryWrites=true&w=majority'
    );
  }

  use(client: Mongoose): void {
    this.client = client;
  }

  async getCompanyInfo(ticker: string): Promise<CompanyInfoDocument | null> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      return await CompanyInfoModel.findByTradingSymbol(ticker);
    } catch (ex) {
      throw new Error(ex);
    }
  }

  async getFilings(ticker: string): Promise<FilingDocument[]> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      const companyInfo = await this.getCompanyInfo(ticker);

      if (companyInfo === null) {
        throw new Error(`Unknown company '${ticker}'!`);
      }

      const filings: FilingDocument[] = [];
      const cursor = FilingModel.find({
        EntityCentralIndexKey: companyInfo.EntityCentralIndexKey
      })
        .select({ _id: 0, __v: 0 })
        .cursor();

      await cursor.eachAsync(async (f: FilingDocument) => {
        filings.push(f);
      });

      return filings;
    } catch (ex) {
      throw new Error(ex);
    }
  }
}

export default FinTenDB;
