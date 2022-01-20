import { parseStr } from '@weirwoodai/parse-xbrl';
import { PathLike } from 'fs';
import { FinTenDB } from '../db/FinTenDB';
import { Filing } from '../db/models/Filing';
import { SecGovTextParser } from '../secgov/SecGovTextParser';
import XBRL from './XBRL';

class XBRLUtilities {
  public static async fromFiles(paths: PathLike[]): Promise<XBRL[]> {
    return await Promise.all(paths.map((p) => XBRLUtilities.fromFile(p)));
  }

  public static async fromFile(path: PathLike): Promise<XBRL> {
    const exceptions: string[] = [];
    const parser: SecGovTextParser = new SecGovTextParser(path);

    while (await parser.hasNext()) {
      try {
        const xml = await parser.next();
        const filing: Filing = await parseStr(xml);
        const xbrl = new XBRL(filing);

        // always add trading symbols; a filing could have been reported with
        // only one of the company's trading symbols, and with this we ensure we
        // have all the trading symbols the company uses
        // A Google filing could only have 'GOOG', but we consistently want
        // 'GOOG;GOOGL'
        const cik = xbrl.getEntityCentralIndexKey();
        const tradingSymbol = await FinTenDB.getInstance().getTradingSymbol(cik);
        if (tradingSymbol) xbrl.setTradingSymbol(tradingSymbol);

        return xbrl;
      } catch (ex) {
        exceptions.push(ex.toString());
      }
    }

    throw new Error(exceptions.join('\n') || 'No XBRL found');
  }
}

export default XBRLUtilities;
