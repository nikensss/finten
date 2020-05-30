import fs, { PathLike } from 'fs';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import Downloadable from './Downloadable';
import TimedQueue from './queues/TimedQueue';
import Queue from './queues/Queue';
import DefaultQueue from './queues/DefaultQueue';

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

  @Speedometer()
  private static activeFileWrites: number = 0;

  private q: Queue;

  constructor(directory: PathLike) {
    this._directory = directory;
    if (!fs.existsSync(this.dir)) {
      this.log(`directory '${this.dir}' doesn't exist, creating...`);
      fs.mkdirSync(this.dir);
      this.log('creation successful!');
    }
    this.q = new DefaultQueue();
  }

  public use(q: Queue): void {
    this.q = q;
  }

  public get dir(): PathLike {
    return this._directory;
  }

  public flush(): void {
    fs.readdirSync(this.dir).forEach((f) => {
      this.log(`deleting ${f}`);
      fs.unlinkSync(path.join(this.dir.toString(), f));
    });
  }

  public queue(...d: Downloadable[]) {
    this.q.queue(...d);
  }

  public async dequeue(): Promise<void[]> {
    const downloads: Promise<void>[] = [];
    while (!this.q.isEmpty()) {
      downloads.push(this._get((await this.q.dequeue()) as Downloadable));
      // await this._get((await this.q.dequeue()) as Downloadable);
    }

    return Promise.all(downloads);
    // return Promise.resolve();
  }

  /**
   * Queues and immediately downloads (respecting the request rate limit) the given collection of Downloadables.
   * @param d Collection of Downloadables
   */
  public async get(...d: Downloadable[]): Promise<void> {
    this.queue(...d);
    await this.dequeue();
  }

  /**
   * Returns all the downloads or all the downloads with the specified extensions.
   *
   * @param extension the extension of the file including the '.' (dot)
   */
  public listDownloads(extension?: string): PathLike[] {
    return fs
      .readdirSync(this.dir)
      .map((f) => path.join(this.dir.toString(), f.toString()))
      .filter((f) => path.extname(f).toLowerCase() === (extension || ''));
  }

  private log(...args: any[]): void {
    console.log(chalk.blue(`[DownloadManager]`), ...args);
  }

  private warning(...args: any[]) {
    console.log(chalk.bgYellow(`[DownloadManager]`), ...args);
  }

  /**
   * Private implementation that performs the actual HTTP.GET request.
   * @param d Downloadable to 'GET'
   */
  private async _get(d: Downloadable): Promise<void> {
    this.log(`downloading: ${d.url}`);
    DownloadManager.activeDownloads += 1;
    const p = path.resolve(this.dir.toString(), d.fileName);
    const writer = fs.createWriteStream(p);

    const response = await axios({
      url: d.url,
      method: 'GET',
      responseType: 'stream'
    });

    DownloadManager.activeFileWrites += 1;
    response.data.pipe(writer);
    DownloadManager.activeDownloads -= 1;

    return new Promise((res, rej) => {
      writer.on('finish', () => {
        DownloadManager.activeFileWrites -= 1;
        this.log(`done writting: ${d.fileName}`);
        res();
      });
      writer.on('error', () => {
        DownloadManager.activeFileWrites -= 1;
        this.log(`error while writting: ${d.fileName}`);
        rej();
      });
    });
  }
}

export default DownloadManager;
