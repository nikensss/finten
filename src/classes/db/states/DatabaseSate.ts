import FilingMetadata from '../../filings/FilingMetadata';
import Database from '../Database.interface';
import { CompanyInfoDocument } from '../models/CompanyInfo';
import { FilingDocument } from '../models/Filing';

export abstract class DatabaseState {
  constructor(private _db: Database) {}

  get db(): Database {
    return this._db;
  }

  abstract deactivate(): Promise<void>;

  abstract getCompanyInfo(ticker: string): Promise<CompanyInfoDocument | null>;

  abstract getTradingSymbol(cik: number): Promise<string | null>;

  abstract getFilings(ticker: string): Promise<FilingDocument[]>;

  abstract isLinkVisited(filingMetadata: FilingMetadata): Promise<boolean>;
}
