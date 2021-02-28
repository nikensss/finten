import { PathLike } from 'fs';
import { parseStr } from 'parse-xbrl';
import { Filing } from '../db/models/Filing';
import XBRL from './XBRL';
import SecGovTextParser from '../secgov/SecGovTextParser';

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
        return new XBRL(filing);
      } catch (ex) {
        exceptions.push(ex.toString());
      }
    }

    throw new Error(exceptions.join('\n') || 'No XBRL found');
  }
}

export default XBRLUtilities;
