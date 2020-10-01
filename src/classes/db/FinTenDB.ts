import {
  Collection,
  FilterQuery,
  InsertOneWriteOpResult,
  MongoClient,
  SchemaMember,
  UpdateQuery
} from 'mongodb';

class FinTenDB {
  private static readonly URI: string =
    'mongodb+srv://' +
    process.env.MONGODB_USER +
    ':' +
    process.env.MONGODB_PASS +
    '@dev-cluster.vvwni.gcp.mongodb.net/test?retryWrites=true&w=majority';

  private static readonly DB_NAME: string | undefined = process.env.DB_NAME;
  private static instance: FinTenDB | null = null;
  private client: MongoClient;

  private constructor() {
    this.client = new MongoClient(FinTenDB.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  public static async getInstance(): Promise<FinTenDB> {
    if (typeof process.env.DB_NAME !== 'string') {
      throw new Error('No DB_NAME defined in .env!');
    }

    if (FinTenDB.instance === null) {
      FinTenDB.instance = new FinTenDB();
      await FinTenDB.instance.client.connect();
    }

    return FinTenDB.instance;
  }

  async insertFiling(filing: any): Promise<InsertOneWriteOpResult<any>> {
    return await this.insertOne(this.filings, filing);
  }

  async insertVisitedLink(link: any): Promise<InsertOneWriteOpResult<any>> {
    return await this.insertOne(this.visitedLinks, link);
  }

  async insertOne(
    collection: Collection,
    o: any
  ): Promise<InsertOneWriteOpResult<any>> {
    //TODO: maybe don't check this absolutely every time
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    return await collection.insertOne(o);
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

  public async updateFilings(
    match: FilterQuery<any>,
    update: UpdateQuery<any>
  ) {
    return await this.update(this.filings, match, update);
  }

  public async updateVisitedLinks(match: FilterQuery<any>, update: any) {
    return await this.update(this.visitedLinks, match, { $set: update });
  }

  public async update(
    collection: Collection,
    match: FilterQuery<any>,
    update: UpdateQuery<any>
  ) {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    return await collection.updateOne(match, update);
  }

  public async distinct(key: string) {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    return await this.client
      .db(FinTenDB.DB_NAME)
      .collection('filings')
      .distinct(key);
  }

  async exists(o: any): Promise<boolean> {
    throw new Error('Unsupported operation');
  }

  private get filings(): Collection {
    return this.client.db(FinTenDB.DB_NAME).collection('filings');
  }

  private get visitedLinks() {
    return this.client.db(FinTenDB.DB_NAME).collection('visited-links');
  }
}

export default FinTenDB;
