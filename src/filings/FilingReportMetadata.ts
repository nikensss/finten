import FormType, { asFiling } from './FormType';

class FilingReportMetadata {
  private _cik: number;
  private _companyName: string;
  private _filing: FormType;
  private _submissionDate: Date;
  private _relativePath: string;
  private _xbrlUrl: string;

  constructor(reportMetadata: string) {
    console.log(`parsing: ${reportMetadata}`);
    const reportArray: string[] = reportMetadata.split('|');
    this._cik = parseInt(reportArray[0]);
    this._companyName = reportArray[1];
    this._filing = asFiling(reportArray[2]);
    this._submissionDate = new Date(reportArray[3]);
    this._relativePath = reportArray[4];
    this._xbrlUrl = this.generateUrl(this._relativePath);
  }

  generateUrl(relativePath: string): string {
    let blocks = relativePath.split('.')[0].split('/');

    //let edgar = blocks[0]
    //let data = blocks[1]
    let cik = blocks[2];
    let accesionNumber = blocks[3].replace(/-/g, '');
    let rawAccessionNumber = blocks[3];

    return `https://www.sec.gov/Archives/edgar/data/${cik}/${accesionNumber}/${rawAccessionNumber}-xbrl.zip`;
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

  get xbrUrl(): string {
    return this._xbrlUrl;
  }
}

export default FilingReportMetadata;
