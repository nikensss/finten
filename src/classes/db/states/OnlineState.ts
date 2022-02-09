import { FilingMetadata } from '../../filings/FilingMetadata';
import Database from '../Database.interface';
import CompanyInfoModel, { CompanyInfoDocument } from '../models/CompanyInfo';
import FilingModel, { FilingDocument } from '../models/Filing';
import VisitedLinkModel from '../models/VisitedLink';
import { DatabaseState } from './DatabaseSate';

export class OnlineState extends DatabaseState {
  constructor(db: Database) {
    super(db);
  }

  async deactivate(): Promise<void> {
    return;
  }

  async getCompanyInfo(ticker: string): Promise<CompanyInfoDocument | null> {
    return await CompanyInfoModel.findByTradingSymbol(ticker);
  }

  async getTradingSymbol(cik: number): Promise<string | null> {
    const companyInfos = await CompanyInfoModel.findByEntityCentralIndexKey(cik);
    if (!companyInfos || companyInfos.length <= 0) return null;

    return companyInfos.map(({ TradingSymbol }) => TradingSymbol).join(';');
  }

  async getFilings(ticker: string): Promise<FilingDocument[]> {
    const companyInfo = await this.getCompanyInfo(ticker);
    if (companyInfo === null) throw new Error(`Unknown company '${ticker}'!`);

    const filings: FilingDocument[] = [];
    const cursor = FilingModel.find({
      EntityCentralIndexKey: companyInfo.EntityCentralIndexKey
    })
      .select({ _id: 0, __v: 0 })
      .cursor();

    await cursor.eachAsync(async (f: FilingDocument | FilingDocument[]) => {
      Array.isArray(f) ? filings.push(...f) : filings.push(f);
    });

    return filings.sort((a, b) => {
      const aTime = new Date(a.DocumentPeriodEndDate).getTime();
      const bTime = new Date(b.DocumentPeriodEndDate).getTime();
      return aTime - bTime;
    });
  }

  async isLinkVisited(filingMetadata: FilingMetadata): Promise<boolean> {
    return await VisitedLinkModel.exists({ url: filingMetadata.url });
  }
}
