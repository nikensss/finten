import { CompanyInfoDocument } from './models/CompanyInfo';
import { FilingDocument } from './models/Filing';

interface Database {
  connect(uri?: string): Promise<Database>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getCompanyInfo(ticker: string): Promise<CompanyInfoDocument | null>;
  getFilings(ticker: string): Promise<FilingDocument[]>;
}

export default Database;
