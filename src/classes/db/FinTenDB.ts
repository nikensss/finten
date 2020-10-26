import mongoose, { Mongoose, QueryCursor } from 'mongoose';
import Database from './Database';
import CompanyInfoModel, { CompanyInfo, CompanyInfoDocument } from './models/CompanyInfo';
import FilingModel, { Filing, FilingDocument } from './models/Filing';
import UserModel, { User, UserDocument } from './models/User';
import VisitedLinkModel, { VisitedLink, VisitedLinkDocument } from './models/VisitedLink';

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
        autoIndex: true,
        useFindAndModify: false
      });

      return this;
    } catch (ex) {
      throw new Error('Could not connect to DB: ' + ex);
    }
  }

  async disconnect(): Promise<void> {
    return await this.client.disconnect();
  }

  private isConnected(): boolean {
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

  async createCompanyInfo(companyInfo: CompanyInfo): Promise<CompanyInfoDocument> {
    return await new CompanyInfoModel(companyInfo).save();
  }

  async createFiling(filing: Filing): Promise<FilingDocument> {
    return await new FilingModel(filing).save();
  }

  async createVisitedLink(visitedLink: VisitedLink): Promise<VisitedLinkDocument> {
    return await new VisitedLinkModel(visitedLink).save();
  }

  async createUser(user: User): Promise<UserDocument> {
    return await new UserModel(user).save();
  }

  findFilings(match: Partial<FilingDocument>, select = ''): QueryCursor<FilingDocument> {
    return FilingModel.find(match, select).cursor();
  }

  findVisitedLinks(
    match: Partial<VisitedLinkDocument>,
    select = ''
  ): QueryCursor<VisitedLinkDocument> {
    return VisitedLinkModel.find(match, select).cursor();
  }

  async findUser(match: Partial<UserDocument>, select = ''): Promise<UserDocument | null> {
    return await UserModel.findOne(match, select);
  }

  async findCompanyInfoByEntityCentralIndexKey(
    entityCentralIndexKey: number
  ): Promise<CompanyInfoDocument[]> {
    return await CompanyInfoModel.findByEntityCentralIndexKey(entityCentralIndexKey);
  }
  async findCompanyInfoByTradingSymbol(tradingSymbol: string): Promise<CompanyInfoDocument | null> {
    return await CompanyInfoModel.findByTradingSymbol(tradingSymbol);
  }

  async distinctFilingKey(key: string): Promise<string[]> {
    if (!this.isConnected()) {
      throw new Error('No connection to the DB!');
    }

    return await FilingModel.distinct(key);
  }
}

export default FinTenDB;
