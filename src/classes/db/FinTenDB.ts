import mongoose, { Mongoose } from 'mongoose';
import FilingSchema, { Filing } from './models/FilingSchema';
import VisitedLinkSchema, { VisitedLink } from './models/VisitedLinkSchema';

class FinTenDB {
  private static instance: FinTenDB | null = null;
  private client: Mongoose = mongoose;

  private constructor() {}

  public static async getInstance(): Promise<FinTenDB> {
    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
    }

    if (FinTenDB.isConnected()) return FinTenDB.instance;

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

    return FinTenDB.instance;
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

  async insertFiling(filing: any): Promise<Filing> {
    return await FilingSchema.create(filing);
  }

  async insertVisitedLink(visitedLink: any): Promise<VisitedLink> {
    return await VisitedLinkSchema.create(visitedLink);
  }

  async findFilings(match?: any, select?: string | object) {
    return await FilingSchema.find(match, select);
  }

  async findVisitedLinks(match?: any, select?: string | object) {
    return await VisitedLinkSchema.find(match, select);
  }

  public async updateFilings(match: any, update: any) {
    throw new Error('Unsupported!');
    // return await this.update(this.filings, match, update);
  }

  public async updateVisitedLinks(match: any, update: any) {
    throw new Error('Unsupported!');
    // return await this.update(this.visitedLinks, match, { $set: update });
  }

  public async update() {
    if (!FinTenDB.isConnected()) {
      throw new Error('No connection to the DB!');
    }

    return await Promise.reject(null);
  }

  public async distinctFilingKey(key: string) {
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
