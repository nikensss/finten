import fs, { PathLike } from 'fs';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import FinTenDownload from './Downloadable';
import Downloadable from './Downloadable';
import TimedQueue from './TimedQueue';

function Speedometer() {
  return function (target: any, key: string) {
    //target === parent class
    //key === decorated property
    let val = target[key];

    const getter = () => val;
    const setter = (next: number) => {
      console.log(chalk.red(`[Speedometer] ${key}: ${val} → ${next}`));
      val = next;
    };

    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  };
}

class DownloadManager {
  private _directory: PathLike;

  @Speedometer()
  private static activeDownloads: number = 0;

  private _queue: TimedQueue;

  constructor(directory: PathLike, maxDownloadsPerSecond: number) {
    this._directory = directory;
    if (!fs.existsSync(this.dir)) {
      this.log(`directory '${this.dir}' doesn't exist, creating...`);
      fs.mkdirSync(this.dir);
      this.log('creation successful!');
    }
    this._queue = new TimedQueue(maxDownloadsPerSecond);
  }

  public get dir(): PathLike {
    return this._directory;
  }

  public queue(...d: Downloadable[]) {
    this._queue.queue(...d);
  }

  public async unqueueFirst() {
    const downloadable = await this._queue.unqueue();
    if (typeof downloadable !== 'undefined') {
      this.get(downloadable);
    }
  }

  public async unqueue() {
    while (!this._queue.empty) {
      await this.unqueueFirst();
    }
  }

  private async get(d: Downloadable): Promise<void> {
    this.log(`downloading: ${d.url}`);
    DownloadManager.activeDownloads += 1;
    const p = path.resolve(this.dir.toString(), d.fileName);
    const writer = fs.createWriteStream(p);

    const response = await axios({
      url: d.url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);
    DownloadManager.activeDownloads -= 1;

    return new Promise((res, rej) => {
      writer.on('finish', () => {
        this.log(`done writting: ${d.fileName}`);
        res();
      });
      writer.on('error', () => {
        this.log(`error while writting: ${d.fileName}`);
        rej();
      });
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
