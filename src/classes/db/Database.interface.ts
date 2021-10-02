import FilingMetadata from '../filings/FilingMetadata';
import { CompanyInfoDocument } from './models/CompanyInfo';
import { FilingDocument } from './models/Filing';

interface Database {
  connect(uri?: string): Promise<Database>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getCompanyInfo(ticker: string): Promise<CompanyInfoDocument | null>;
  getTradingSymbol(cik: number): Promise<string | null>;
  getFilings(ticker: string): Promise<FilingDocument[]>;
  isLinkVisited(filingMetadata: FilingMetadata): Promise<boolean>;
}

export default Database;
