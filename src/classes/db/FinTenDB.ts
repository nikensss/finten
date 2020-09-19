import { Collection, FilterQuery, MongoClient, SchemaMember } from 'mongodb';

class FinTenDB {
  private static readonly URI: string =
    'mongodb+srv://' +
    process.env.MONGODB_USER +
    ':' +
    process.env.MONGODB_PASS +
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

  public static async getInstance(): Promise<FinTenDB> {
    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
      await FinTenDB.instance.client.connect();
    }

    return FinTenDB.instance;
  }

  async insertFiling(filing: any) {
    await this.insertOne(this.filings, filing);
  }

  async insertVisitedLink(link: any) {
    await this.insertOne(this.visitedLinks, link);
  }

  async insertOne(collection: Collection, o: any) {
    //TODO: maybe don't check this absolutely every time
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    await collection.insertOne(o);
  }

  async findFilings(match: FilterQuery<any>, select?: SchemaMember<any, any>) {
    return await this.find(this.filings, match, select);
  }

  async findVisitedLinks(
    match: FilterQuery<any>,
    select?: SchemaMember<any, any>
  ) {
    return await this.find(this.visitedLinks, match, select);
  }

  private async find(
    collection: Collection,
    match: FilterQuery<any>,
    select?: SchemaMember<any, any>
  ) {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    return await collection
      .find(match)
      .project(select || {})
      .toArray();
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
