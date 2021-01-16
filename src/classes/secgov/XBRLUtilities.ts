import fs, { PathLike } from 'fs';
import { parseStr } from 'parse-xbrl';
import { Filing } from '../db/models/Filing';
import { default as LOGGER } from '../logger/DefaultLogger';
import XBRL from './XBRL';

class XBRLUtilities {
  public static async fromTxts(paths: PathLike[]): Promise<XBRL[]> {
    return await Promise.all(paths.map((p) => XBRLUtilities.fromTxt(p)));
  }

  public static async fromTxt(path: PathLike): Promise<XBRL> {
    const xmls: string[] = XBRLUtilities.extractXmlsFromTxt(path);
    const exceptions: string[] = [];

    for (const xml of xmls) {
      try {
        const xbrl: Filing = await parseStr(xml);
        return new XBRL(xbrl);
      } catch (ex) {
        exceptions.push(ex.toString());
      }
    }

    throw new Error(exceptions.join('\n'));
  }

  public static extractXmlsFromTxt(path: PathLike): string[] {
    const xmls: string[] = [];

    let extraction = this.extractXmlFromTxt(path, 0);
    xmls.push(extraction.xml);

    while (!extraction.isDone) {
      try {
        extraction = this.extractXmlFromTxt(path, extraction.index);
        xmls.push(extraction.xml);
      } catch (ex) {
        if (ex.toString() === 'Error: No XBRL found!') {
          break;
        }
        throw ex;
      }
    }

    return xmls;
  }

  public static extractXmlFromTxt(
    path: PathLike,
    start = 0
  ): { xml: string; index: number; isDone: boolean } {
    LOGGER.get(this.constructor.name).debug(`parsing txt: ${path}`);

    const lines = fs.readFileSync(path, 'utf-8').split('\n');
    const xml: string[] = [];
    let i: number = start;

    while (i < lines.length && !lines[i].includes('<XBRL>')) {
      i += 1;
    }
    //we are now at the opening tag of the XBRL, move one more line to find the XML
    i += 1;
    while (i < lines.length && !lines[i].includes('</XBRL>')) {
      xml.push(lines[i]);
      i += 1;
    }

    if (xml.length === 0) {
      throw new Error('No XBRL found!');
    }

    return { xml: xml.join('\n'), index: i, isDone: i >= lines.length };
  }
}

export default XBRLUtilities;
