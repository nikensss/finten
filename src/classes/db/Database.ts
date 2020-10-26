import { QueryCursor } from 'mongoose';
import { CompanyInfo, CompanyInfoDocument } from './models/CompanyInfo';
import { Filing, FilingDocument } from './models/Filing';
import { User, UserDocument } from './models/User';
import { VisitedLink, VisitedLinkDocument } from './models/VisitedLink';

interface Database {
  connect(uri?: string): Promise<Database>;
  disconnect(): Promise<void>;
  createCompanyInfo(companyInfo: CompanyInfo): Promise<CompanyInfoDocument>;
  createFiling(filing: Filing): Promise<FilingDocument>;
  createUser(user: User): Promise<UserDocument>;
  createVisitedLink(visitedLink: VisitedLink): Promise<VisitedLinkDocument>;
  findCompanyInfoByEntityCentralIndexKey(
    entityCentralIndexKey: number
  ): Promise<CompanyInfoDocument[]>;
  findCompanyInfoByTradingSymbol(tradingSymbol: string): Promise<CompanyInfoDocument | null>;
  findFilings(match: Partial<FilingDocument>, select?: string): QueryCursor<FilingDocument>;
  findVisitedLinks(
    match: Partial<VisitedLinkDocument>,
    select?: string
  ): QueryCursor<VisitedLinkDocument>;
  findUser(match: Partial<UserDocument>, select?: string): Promise<UserDocument | null>;
  distinctFilingKey(key: string): Promise<string[]>;
}

export default Database;
