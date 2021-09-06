import { PathLike, promises as fs } from 'fs';
import { resolve } from 'path';

/**
 * Extracts XBRL sections from a .txt file from SecGov.
 *
 */
export class SecGovTextParser {
  private file: string;
  private fileRead = false;
  private sections: string[] = [];

  private static readonly OPENING_TAG: string = '<XBRL>';
  private static readonly CLOSING_TAG: string = '</XBRL>';

  constructor(file: PathLike) {
    this.file = file.toString();
  }

  async hasNext(): Promise<boolean> {
    if (!this.fileRead) await this.readFile();
    return this.sections.length > 0;
  }

  reset(): void {
    this.fileRead = false;
  }

  async next(): Promise<string> {
    const result = this.sections.shift();
    if (!result) throw new Error('No more data available!');

    return result;
  }

  private async readFile(): Promise<void> {
    const lines = (await fs.readFile(resolve(this.file), 'utf-8')).split('\n');
    let offset = 0;

    while (!this.fileRead) {
      const start = lines.indexOf(SecGovTextParser.OPENING_TAG, offset);
      const end = lines.indexOf(SecGovTextParser.CLOSING_TAG, start);
      offset = end;

      if (start === -1 || end === -1) {
        this.fileRead = true;
        continue;
      }

      this.sections.push(lines.slice(start + 1, end).join('\n'));
    }
  }
}
