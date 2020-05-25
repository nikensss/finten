class FinTenDownload {
  private _url: string;
  private _filename: string;

  constructor(url: string, filename: string) {
    this._url = url;
    this._filename = filename;
  }

  get filename() {
    return this._filename;
  }

  get url() {
    return this._url;
  }
}

export default FinTenDownload;
