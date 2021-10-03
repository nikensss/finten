import FilingMetadata from '../../filings/FilingMetadata';
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
    return this.wrapCommand(() => this.db.getCompanyInfo(ticker));
  }

  getTradingSymbol(cik: number): Promise<string | null> {
    return this.wrapCommand(() => this.db.getTradingSymbol(cik));
  }

  getFilings(ticker: string): Promise<FilingDocument[]> {
    return this.wrapCommand(() => this.db.getFilings(ticker));
  }

  isLinkVisited(filingMetadata: FilingMetadata): Promise<boolean> {
    return this.wrapCommand(() => this.db.isLinkVisited(filingMetadata));
  }

  private wrapCommand<T>(command: () => Promise<T>): Promise<T> {
    return new Promise<T>((res, rej) => {
      this.commandQueue.push(() => command().then(res, rej));
    });
  }
}
