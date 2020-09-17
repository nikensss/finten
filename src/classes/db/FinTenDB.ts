import { Collection, MongoClient } from 'mongodb';

class FinTenDB {
  private static readonly URI: string =
    'mongodb+srv://' +
    process.env.user +
    ':' +
    process.env.pass +
    '@dev-cluster' +
    '.vvwni.azure.mongodb.net/test?retryWrites=true&w=majority';
  private static readonly DB_NAME = 'secgov';
  private static instance: FinTenDB | null = null;
  private client: MongoClient;

  private constructor() {
    this.client = new MongoClient(FinTenDB.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  public static getInstance(): FinTenDB {
    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
    }

    return FinTenDB.instance;
  }

  async insertFiling(filing: any) {
    await this.insertOne(this.filings, filing);
  }

  async insertLink(link: any) {
    await this.insertOne(this.visitedLinks, link);
  }

  async insertOne(collection: Collection, o: any) {
    await collection.insertOne(o);
  }

  async findFilings(match: any, select?: any) {
    return await this.find(this.filings, match, select);
  }

  async findLinks(match: any, select?: any) {
    return await this.find(this.visitedLinks, match, select);
  }

  private async find(collection: Collection, match: any, select: any) {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    return await collection.find(match, select).toArray();
  }

  async exists(o: any): Promise<boolean> {
    return Promise.resolve(false);
  }

  private get filings(): Collection {
    return this.client.db(FinTenDB.DB_NAME).collection('filings');
  }

  private get visitedLinks() {
    return this.client.db(FinTenDB.DB_NAME).collection('visited-links');
  }
}

export default FinTenDB;
