import fs, { PathLike } from 'fs';
import chalk from 'chalk';
import FormType from '../filings/FormType';
import FilingReportMetadata from '../filings/FilingReportMetadata';

class XBRL {
  constructor() {}

  parseTxt(path: PathLike): string[] {
    this.log(`parsing txt: ${path}`);
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
    if (i >= lines.length) throw new Error(`XBRL instance could not be found or incomplete in ${path}`);

    return xml;
  }

  parseTxts(paths: PathLike[]): { name: PathLike; xml: string[] }[] {
    return paths.map((p) => ({ name: p, xml: this.parseTxt(p) }));
  }

  /**
   * Parses all .idx files in the 'downloads' folder and returns the
   * FilingReportMetadata's that correspond to the desired form type.
   *
   * @param formType Form type to look for
   * @param amount The amount of filings to return
   */
  parseIndex(path: PathLike, formType: FormType, amount?: number): FilingReportMetadata[] {
    this.log(`parsing idx: ${path}`);
    let lines = fs.readFileSync(path, 'utf8').split('\n');
    return lines
      .reduce((t, c) => {
        try {
          const frm = new FilingReportMetadata(c);
          if (frm.formType === formType) t.push(frm);
        } catch (ex) {
          //swallow the error: possible reason is that the FormType is not in the enum
        }
        return t;
      }, [] as FilingReportMetadata[])
      .slice(0, amount);
  }

  parseIndices(path: PathLike[], formType: FormType, amount?: number): FilingReportMetadata[] {
    return path
      .map((p) => this.parseIndex(p, formType))
      .flat()
      .slice(0, amount);
  }

  private log(msg: string) {
    console.log(chalk.green(`[XBRL] ${msg}`));
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
