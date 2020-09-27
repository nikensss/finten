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
    const xmls: string[] = XBRL.extractXmlsFromTxt(path);
    const exceptions: string[] = [];

    for (let xml of xmls) {
      try {
        const xbrl = await ParseXbrl.parseStr(xml);
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
    start: number = 0
  ): { xml: string; index: number; isDone: boolean } {
    DefaultLogger.get(this.constructor.name).debug(
      this.constructor.name,
      `parsing txt: ${path}`
    );
    const lines = fs.readFileSync(path, 'utf-8').split('\n');
    const xml: string[] = [];
    let i: number = start;
    while (i < lines.length && !lines[i].includes('<XBRL>')) {
      i += 1;
    }
    //we are now at the opnening tag of the XBRL, move one more line to find the XML
    i += 1;
    while (i < lines.length && !lines[i].includes('</XBRL>')) {
      xml.push(lines[i]);
      i += 1;
    }

    //TODO: through exception if xml.length === 0
    if (xml.length === 0) {
      throw new Error('No XBRL found!');
    }

    return { xml: xml.join('\n'), index: i, isDone: i >= lines.length };
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
