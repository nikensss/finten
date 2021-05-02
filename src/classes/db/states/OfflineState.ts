import Database from '../Database.interface';
import { CompanyInfoDocument } from '../models/CompanyInfo';
import { FilingDocument } from '../models/Filing';
import { DatabaseState } from './DatabaseSate';

type AsyncCommand = () => Promise<void>;

export class OfflineState extends DatabaseState {
  private commandQueue: AsyncCommand[] = [];

  constructor(db: Database) {
    super(db);
  }

  async deactivate(): Promise<void> {
    await Promise.all(this.commandQueue.map((asyncCommand) => asyncCommand()));
  }

  getCompanyInfo(ticker: string): Promise<CompanyInfoDocument | null> {
    return new Promise((res, rej) => {
      this.commandQueue.push(() => this.db.getCompanyInfo(ticker).then(res, rej));
    });
  }

  getFilings(ticker: string): Promise<FilingDocument[]> {
    return new Promise((res, rej) => {
      this.commandQueue.push(() => this.db.getFilings(ticker).then(res, rej));
    });
  }
}
