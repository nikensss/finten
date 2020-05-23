import FormType, { asFiling } from './FormType';

class FilingReportMetadata {
  private _cik: number;
  private _companyName: string;
  private _filing: FormType;
  private _submissionDate: Date;
  private _relativePath: string;

  constructor(reportMetadata: string) {
    const reportArray: string[] = reportMetadata.split('|');
    this._cik = parseInt(reportArray[0]);
    this._companyName = reportArray[1];
    this._filing = asFiling(reportArray[2]);
    this._submissionDate = new Date(reportArray[3]);
    this._relativePath = reportArray[4];
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

  get relativePath(): string {
    return this._relativePath;
  }

  get fullPath(): string {
    return `https://www.sec.gov/Archives/${this.relativePath}`;
  }

  get fileName(): string {
    const fileName: string | undefined = this.relativePath.split('/').pop();
    if (typeof fileName === 'undefined') {
      throw new Error(`Can't retrieve fileName from relative path: ${this.relativePath}`);
    }
    return fileName;
  }
}

export default FilingReportMetadata;
