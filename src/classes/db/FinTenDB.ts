import mongoose, { Mongoose } from 'mongoose';
import FilingSchema, { FilingModel, Filing } from './models/Filing';
import TickerModel, { Ticker, TickerDocument } from './models/Ticker';
import UserSchema, { UserModel, User } from './models/User';
import VisitedLinkSchema, {
  VisitedLinkModel,
  VisitedLink
} from './models/VisitedLink';

class FinTenDB {
  private static instance: FinTenDB | null = null;
  private client: Mongoose = mongoose;

  private constructor() {}

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

  use(client: Mongoose) {
    this.client = client;
  }

  async insertTicker(ticker: Ticker): Promise<TickerDocument> {
    return await TickerModel.create(ticker);
  }
  async insertFiling(filing: Filing): Promise<FilingModel> {
    return await FilingSchema.create(filing);
  }

  async insertVisitedLink(visitedLink: VisitedLink): Promise<VisitedLinkModel> {
    return await VisitedLinkSchema.create(visitedLink);
  }

  async insertUser(user: User): Promise<UserModel> {
    return await UserSchema.create(user);
  }

  async findFilings(match?: any, select: string | object = {}) {
    return await FilingSchema.find(match, select);
  }

  async findVisitedLinks(
    match: Partial<VisitedLink> = {},
    select: string | object = {}
  ) {
    return await VisitedLinkSchema.find(match, select);
  }

  async findUser(match: Partial<User> = {}, select: string | object = {}) {
    return await UserSchema.findOne(match);
  }

  async updateFilings(match: any, update: any) {
    throw new Error('Unsupported!');
    // return await FilingSchema.updateOne(match, update);
  }

  async updateVisitedLinks(
    match: Partial<VisitedLink>,
    update: Partial<VisitedLink>
  ) {
    return await VisitedLinkSchema.updateOne(match, update, {
      runValidators: true
    });
  }

  async distinctFilingKey(key: string) {
    if (!FinTenDB.isConnected()) {
      throw new Error('No connection to the DB!');
    }

    return await FilingSchema.distinct(key);
  }

  async exists(o: any): Promise<boolean> {
    throw new Error('Unsupported operation');
  }
}

export default FinTenDB;
