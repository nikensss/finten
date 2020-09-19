import fs, { PathLike } from 'fs';
import ParseXbrl from 'parse-xbrl';
import DefaultLogger from '../logger/DefaultLogger';

class XBRL {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  /**
   * Returns the XBRL data.
   */
  get(): any {
    return this.data;
  }

  set partialPath(partialPath: string) {
    this.data.partialPath = partialPath;
  }

  public static async fromTxts(paths: PathLike[]): Promise<XBRL[]> {
    return await Promise.all(paths.map(p => XBRL.fromTxt(p)));
  }

  public static async fromTxt(path: PathLike): Promise<XBRL> {
    const xml = XBRL.extractXmlFromTxt(path);
    try {
      const xbrl = await ParseXbrl.parseStr(xml);
      return new XBRL(xbrl);
    } catch (ex) {
      throw new Error(`Exception while parsing XBRL: ${ex}`);
    }
  }

  private static extractXmlFromTxt(path: PathLike): string {
    DefaultLogger.get(this.constructor.name).debug(
      this.constructor.name,
      `parsing txt: ${path}`
    );
    const lines = fs.readFileSync(path, 'utf-8').split('\n');
    const xml: string[] = [];
    let i: number = 0;
    while (!lines[i].includes('<XBRL>') && i < lines.length) {
      i += 1;
    }
    //we are now at the opnening tag of the XBRL, move one more line to find the XML
    i += 1;
    while (!lines[i].includes('</XBRL>') && i < lines.length) {
      xml.push(lines[i]);
      i += 1;
    }
    if (i >= lines.length) {
      throw new Error(`XBRL instance not found or incomplete at ${path}`);
    }

    return xml.join('\n');
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
