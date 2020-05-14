import { default as fs, promises as fsp, PathLike } from 'fs';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';

class DownloadManager {
  private _directory: PathLike;

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

  async get(url: string, fileName: string): Promise<void> {
    this.log(`downloading: ${url}`);

    const p = path.resolve(this.dir.toString(), fileName);
    const writer = fs.createWriteStream(p);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((res, rej) => {
      writer.on('finish', res);
      writer.on('error', rej);
    });
  }

  public listDownloads(): PathLike[] {
    return fs.readdirSync(this.dir).map((n) => path.join(this.dir.toString(), n));
  }

  private log(msg: string) {
    console.log(chalk.blue(`[DownloadManager] ${msg}`));
  }
}

export default DownloadManager;
