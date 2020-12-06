import mongoose, { Mongoose } from 'mongoose';
import Database from './Database.interface';

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
        useFindAndModify: false,
        keepAlive: true,
        keepAliveInitialDelay: 300000
      });
      console.log('Database connected!');

      return this;
    } catch (ex) {
      throw new Error('Could not connect to DB: ' + ex);
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
}

export default FinTenDB;
