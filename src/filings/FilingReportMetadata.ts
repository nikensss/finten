import Filing, { asFiling } from './Filing';

class FilingReportMetadata {
  private _cik: number;
  private _company: string;
  private _filing: Filing;
  private _submissionDate: Date;
  private _relativePath: string;

  constructor(reportMetadata: string) {
    const reportArray: string[] = reportMetadata.split('|');
    this._cik = parseInt(reportArray[0]);
    this._company = reportArray[1];
    this._filing = asFiling(reportArray[2]);
    this._submissionDate = new Date(reportArray[3]);
    this._relativePath = reportArray[4];
  }

  get cik(): number {
    return this._cik;
  }

  get company(): string {
    return this._company;
  }

  get filing(): Filing {
    return this._filing;
  }

  get submissionDate(): Date {
    return this._submissionDate;
  }

  get relativePath(): string {
    return this._relativePath;
  }
}

export default FilingReportMetadata;
