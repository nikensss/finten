import mongoose, { Mongoose } from 'mongoose';
import Database from './Database';
import FilingModel, { Filing, FilingDocument } from './models/Filing';
import TickerModel, { Ticker, TickerDocument } from './models/Ticker';
import UserModel, { User, UserDocument } from './models/User';
import VisitedLinkModel, {
  VisitedLink,
  VisitedLinkDocument
} from './models/VisitedLink';

class FinTenDB implements Database {
  private static instance: FinTenDB | null = null;
  private client: Mongoose = mongoose;

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
      console.log('connecting...');
      await this.client.connect(uri || FinTenDB.URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        autoIndex: true
      });

      this.client.set('useCreateIndex', true);
      return this;
    } catch (ex) {
      throw new Error('Could not connect to DB: ' + ex);
    }
  }

  async disconnect(): Promise<void> {
    return await this.client.disconnect();
  }

  private isConnected(): boolean {
    return (
      this.client.connection.readyState ===
      this.client.connection.states.connected
    );
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

  async insertTicker(ticker: Ticker): Promise<TickerDocument> {
    try {
      return await TickerModel.create(ticker);
    } catch (ex) {
      throw ex;
    }
  }

  async insertFiling(filing: Filing): Promise<FilingDocument> {
    try {
      return await FilingModel.create(filing);
    } catch (ex) {
      throw ex;
    }
  }

  async insertVisitedLink(
    visitedLink: VisitedLink
  ): Promise<VisitedLinkDocument> {
    try {
      return await VisitedLinkModel.create(visitedLink);
    } catch (ex) {
      throw ex;
    }
  }

  async insertUser(user: User): Promise<UserDocument> {
    try {
      return await UserModel.create(user);
    } catch (ex) {
      throw ex;
    }
  }

  async findFilings(
    match: Partial<FilingDocument>,
    select = ''
  ): Promise<FilingDocument[]> {
    return await FilingModel.find(match, select);
  }

  async findVisitedLinks(
    match: Partial<VisitedLinkDocument>,
    select = ''
  ): Promise<VisitedLinkDocument[]> {
    return await VisitedLinkModel.find(match, select);
  }

  async findUser(
    match: Partial<UserDocument>,
    select = ''
  ): Promise<UserDocument | null> {
    return await UserModel.findOne(match, select);
  }

  async updateFilings(
    match: Partial<Filing>,
    update: Partial<Filing>
  ): Promise<FilingDocument> {
    return await FilingModel.updateOne(match, update, {
      runValidators: true
    });
  }

  async updateVisitedLinks(
    match: Partial<VisitedLink>,
    update: Partial<VisitedLink>
  ): Promise<VisitedLink> {
    throw new Error('Unsupported!');

    return await VisitedLinkModel.updateOne(match, update, {
      runValidators: true
    });
  }

  async distinctFilingKey(key: string): Promise<string[]> {
    if (!this.isConnected()) {
      throw new Error('No connection to the DB!');
    }

    return await FilingModel.distinct(key);
  }
}

export default FinTenDB;
