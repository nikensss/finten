import mongoose, { Mongoose } from 'mongoose';
import FilingSchema, { Filing, FilingDocument } from './models/Filing';
import TickerSchema, { Ticker, TickerDocument } from './models/Ticker';
import UserSchema, { User, UserDocument } from './models/User';
import VisitedLinkSchema, {
  VisitedLink,
  VisitedLinkDocument
} from './models/VisitedLink';

class FinTenDB {
  private static instance: FinTenDB | null = null;
  private client: Mongoose = mongoose;

  public static async getInstance(): Promise<FinTenDB> {
    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
    }

    if (FinTenDB.isConnected()) return FinTenDB.instance;

    await FinTenDB.connect();

    return FinTenDB.instance;
  }

  private static async connect() {
    if (FinTenDB.instance === null) {
      throw new Error('No instance created yet!');
    }

    try {
      console.log('connecting...');
      await FinTenDB.instance.client.connect(FinTenDB.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      FinTenDB.instance.client.set('useCreateIndex', true);
    } catch (ex) {
      throw new Error('Could not connect to DB: ' + ex);
    }
  }

  private static isConnected(): boolean {
    return (
      FinTenDB.instance !== null &&
      FinTenDB.instance.client.connection.readyState ===
        FinTenDB.instance.client.connection.states.connected
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
      return await TickerSchema.create(ticker);
    } catch (ex) {
      throw ex;
    }
  }

  async insertFiling(filing: Filing): Promise<FilingDocument> {
    try {
      return await FilingSchema.create(filing);
    } catch (ex) {
      throw ex;
    }
  }

  async insertVisitedLink(
    visitedLink: VisitedLink
  ): Promise<VisitedLinkDocument> {
    try {
      return await VisitedLinkSchema.create(visitedLink);
    } catch (ex) {
      throw ex;
    }
  }

  async insertUser(user: User): Promise<UserDocument> {
    try {
      return await UserSchema.create(user);
    } catch (ex) {
      throw ex;
    }
  }

  async findFilings(
    match: Partial<FilingDocument>,
    select = ''
  ): Promise<FilingDocument[]> {
    return await FilingSchema.find(match, select);
  }

  async findVisitedLinks(
    match: Partial<VisitedLinkDocument> = {},
    select = ''
  ): Promise<VisitedLinkDocument[]> {
    return await VisitedLinkSchema.find(match, select);
  }

  async findUser(
    match: Partial<UserDocument>,
    select = ''
  ): Promise<UserDocument | null> {
    return await UserSchema.findOne(match, select);
  }

  async updateFilings(
    match: Partial<Filing>,
    update: Partial<Filing>
  ): Promise<FilingDocument> {
    throw new Error('Unsupported!');
    return await FilingSchema.updateOne(match, update, {
      runValidators: true
    });
  }

  async updateVisitedLinks(
    match: Partial<VisitedLink>,
    update: Partial<VisitedLink>
  ): Promise<VisitedLink> {
    return await VisitedLinkSchema.updateOne(match, update, {
      runValidators: true
    });
  }

  async distinctFilingKey(key: string): Promise<string[]> {
    if (!FinTenDB.isConnected()) {
      throw new Error('No connection to the DB!');
    }

    return await FilingSchema.distinct(key);
  }
}

export default FinTenDB;
