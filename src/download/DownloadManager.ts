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
  private then: number = Date.now();

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

  public async unqueue(): Promise<void[]> {
    const downloads: Promise<void>[] = [];
    while (!this._queue.empty) {
      const now = Date.now();
      if (now - this.then <= this._queue.minPeriod) this.warning(`Δt = ${now - this.then} ms`);
      //unqueueing guarantees a guard time
      //which means that 'getting' will always be safe
      //but in order to know if the entire queue has been unqueued, we need to return the
      //aray of promises that is created when we 'get' all those downloads
      downloads.push(this.get((await this._queue.unqueue()) as Downloadable));
      this.then = now;
    }

    return Promise.all(downloads);
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

  private log(...args: any[]): void {
    console.log(chalk.blue(`[DownloadManager]`), ...args);
  }

  private warning(...args: any[]) {
    console.log(chalk.bgYellow(`[DownloadManager]`), ...args);
  }
}

export default DownloadManager;
