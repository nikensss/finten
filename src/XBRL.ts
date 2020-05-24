import fs, { promises as fsp } from 'fs';
import readline from 'readline';
import path from 'path';
import DownloadManager from './download/DownloadManager';
import chalk from 'chalk';
import FormType from './filings/FormType';
import FilingReportMetadata from './filings/FilingReportMetadata';

class XBRL {
  private _dm: DownloadManager;
  constructor(dowloadManager: DownloadManager) {
    this._dm = dowloadManager;
  }

  async getIndex(year: number, quarter: Quarter) {
    const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/${quarter}/xbrl.idx`;
    await this._dm.get(url, `${year}_${quarter}_xbrl.idx`);
  }

  /**
   * Parses all the TXT files from DownloadManager.dir and extracts the XBRL INSTANCE.
   * The XBRL INSTANCE is a XML string that can be parsed.
   */
  async parseTxt(): Promise<any> {
    const xmls: any = [];
    for (let file of this._dm.listDownloads('.txt')) {
      this.log(`parsing txt: ${file.toString()}`);
      const fileStream = fs.createReadStream(path.join(this._dm.dir.toString(), file.toString()));

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let xbrlInstanceDocument: boolean = false;
      let xbrlOpeningTag: boolean = false;
      let xml: string[] = [];

      for await (const line of rl) {
        if (!xbrlInstanceDocument) {
          if (line.includes('XBRL INSTANCE')) {
            xbrlInstanceDocument = true;
          }
          continue;
        }

        if (!xbrlOpeningTag) {
          if (line.includes('<XBRL>')) {
            xbrlOpeningTag = true;
          }
          continue;
        }

        if (line.includes('</XBRL>')) {
          break;
        }

        xml.push(line);
      }

      if (xml.length > 0) {
        xmls.push({
          name: file,
          xml: xml.join('\n')
        });
      }
    }
    return xmls;
  }

  /**
   * Parses all .idx files in DownloadManager.dir and returns the filing reports' metadata of the
   * requested form types.
   *
   * @param formType the form type to look for.
   */
  async parseIndex(formType: FormType): Promise<FilingReportMetadata[]> {
    const filings: FilingReportMetadata[] = [];

    for (let file of this._dm.listDownloads('.idx')) {
      this.log(`parsing idx: ${file.toString()}`);
      let lines = (await fsp.readFile(path.join(this._dm.dir.toString(), file.toString()), 'utf8')).split('\n');
      filings.push(
        ...lines.reduce((t, c) => {
          try {
            const frm = new FilingReportMetadata(c);
            if (frm.formType === formType) t.push(frm);
          } catch (ex) {
            //swallow the error
          }
          return t;
        }, [] as FilingReportMetadata[])
      );
    }

    return filings;
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
