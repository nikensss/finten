import FormType, { byName } from './FormType';
import Downloadable from '../download/Downloadable';

class FilingReportMetadata implements Downloadable {
  private _cik: number;
  private _companyName: string;
  private _filing: FormType;
  private _submissionDate: Date;
  private _partialPath: string;

  constructor(reportMetadata: string) {
    const reportArray: string[] = reportMetadata.split('|');
    this._cik = parseInt(reportArray[0]);
    this._companyName = reportArray[1];
    this._filing = byName(reportArray[2]);
    this._submissionDate = new Date(reportArray[3]);
    this._partialPath = reportArray[4];
  }

  get cik(): number {
    return this._cik;
  }

  get companyName(): string {
    return this._companyName;
  }

  get formType(): FormType {
    return this._filing;
  }

  get submissionDate(): Date {
    return this._submissionDate;
  }

  get partialPath(): string {
    return this._partialPath;
  }

  get fullPath(): string {
    return `https://www.sec.gov/Archives/${this.partialPath}`;
  }

  get url(): string {
    return this.fullPath;
  }

  get fileName(): string {
    const fileName: string | undefined = this.partialPath.split('/').pop();
    if (typeof fileName === 'undefined') {
      throw new Error(
        `Can't retrieve fileName from relative path: ${this.partialPath}`
      );
    }
    return fileName;
  }
}

export default FilingReportMetadata;
