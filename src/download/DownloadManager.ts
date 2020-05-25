import fs, { PathLike } from 'fs';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import FinTenDownload from './FinTenDownload';

class DownloadManager {
  private _directory: PathLike;

  private static activeDownloads: number = 0;
  private finTenDownloads: FinTenDownload[] = [];

  constructor(directory: PathLike) {
    this._directory = directory;
    if (!fs.existsSync(this.dir)) {
      this.log(`directory '${this.dir}' doesn't exist, creating...`);
      fs.mkdirSync(this.dir);
      this.log('creation successful!');
    }
  }

  public get dir(): PathLike {
    return this._directory;
  }

  public queue(url: string, fileName: string) {
    this.finTenDownloads.push(new FinTenDownload(url, fileName));
  }

  private async get(url: string, fileName: string): Promise<void> {
    this.log(`currently active downloads: ${DownloadManager.activeDownloads}`);

    this.log(`downloading: ${url}`);
    DownloadManager.activeDownloads += 1;
    const p = path.resolve(this.dir.toString(), fileName);
    const writer = fs.createWriteStream(p);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);
    DownloadManager.activeDownloads += 1;

    return new Promise((res, rej) => {
      writer.on('finish', res);
      writer.on('error', rej);
    });
  }

  public listDownloads(extension?: string): PathLike[] {
    return fs.readdirSync(this.dir).filter((f) => path.extname(f).toLowerCase() === (extension || ''));
  }

  private log(msg: string): void {
    console.log(chalk.blue(`[DownloadManager] ${msg}`));
  }
}

export default DownloadManager;
