import { parseStr } from '@weirwoodai/parse-xbrl';
import { PathLike } from 'fs';
import FinTenDB from '../db/FinTenDB';
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

        if (!xbrl.hasTradingSymbol()) {
          const cik = xbrl.getEntityCentralIndexKey();
          const tradingSymbol = await FinTenDB.getInstance().getTradingSymbol(cik);
          if (tradingSymbol) xbrl.setTrandingSymbol(tradingSymbol);
        }

        return xbrl;
      } catch (ex) {
        exceptions.push(ex.toString());
      }
    }

    throw new Error(exceptions.join('\n') || 'No XBRL found');
  }
}

export default XBRLUtilities;
