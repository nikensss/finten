import mongoose, { Mongoose } from 'mongoose';
import { default as LOGGER } from '../logger/DefaultLogger';
import { Logger } from '../logger/Logger.interface';
import Database from './Database.interface';
import { CompanyInfoDocument } from './models/CompanyInfo';
import { FilingDocument } from './models/Filing';
import { DatabaseState } from './states/DatabaseSate';
import { OfflineState } from './states/OfflineState';
import { OnlineState } from './states/OnlineState';

class FinTenDB implements Database {
  private static instance: FinTenDB | null = null;
  private client: Mongoose = mongoose;
  private logger: Logger = LOGGER.get(this.constructor.name);
  private state: DatabaseState;

  private constructor() {
    this.state = new OfflineState(this);
  }

  static getInstance(): Database {
    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
    }

    return FinTenDB.instance;
  }

  async connect(uri?: string): Promise<Database> {
    if (this.isConnected()) return this;

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
      const offline = this.state;
      this.state = new OnlineState(this);
      await offline.deactivate();

      return this;
    } catch (ex) {
      this.logger.error('Could not connect to DB: ' + ex.toString());
      throw new Error('Could not connect to DB: ' + ex.toString());
    }
  }

  async disconnect(): Promise<void> {
    const online = this.state;
    this.state = new OfflineState(this);
    await online.deactivate();
    return await this.client.disconnect();
  }

  public isConnected(): boolean {
    return this.client.connection.readyState === this.client.STATES.connected;
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
    return this.state.getCompanyInfo(ticker);
  }

  async getFilings(ticker: string): Promise<FilingDocument[]> {
    return this.state.getFilings(ticker);
  }
}

export default FinTenDB;
