import fs, { PathLike } from 'fs';
import path from 'path';
import axios from 'axios';
import Downloadable from './Downloadable';
import Queue from './queues/Queue';
import DefaultQueue from './queues/DefaultQueue';
import { default as LOGGER } from '../logger/DefaultLogger';

function Speedometer() {
  const args = arguments;
  return function (target: any, key: string) {
    //target === parent class
    //key === decorated property
    let val = target[key];

    const getter = () => val;
    const setter = (next: number) => {
      LOGGER.get('Speedometer').debug(
        'Speedometer',
        `${key}: ${val} → ${next}`
      );
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

  constructor(directory: PathLike = 'finten_downloads') {
    this._directory = directory;

    if (!fs.existsSync(this.dir)) {
      LOGGER.get(this.constructor.name).info(
        `directory '${this.dir}' doesn't exist, creating...`
      );
      fs.mkdirSync(this.dir);
      LOGGER.get(this.constructor.name).info('creation successful!');
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
    LOGGER.get(this.constructor.name).info('flushing downloads! 🚾');
    fs.readdirSync(this.dir).forEach(f => {
      const currentPath = path.join(this.dir.toString(), f);
      if (fs.lstatSync(currentPath).isDirectory()) {
        this.deldir(currentPath);
      }
      LOGGER.get(this.constructor.name).debug(`deleting ${f}`);
      fs.unlinkSync(currentPath);
    });
    LOGGER.get(this.constructor.name).info('done flusing 🚽');
  }

  public queue(...d: Downloadable[]) {
    this.q.queue(...d);
  }

  /**
   * Starts emptying the queue by 'GET'ting all the elements in it.
   *
   * @returns a promise that resolves to the locations of where the downloadbles
   * were downloaded to.
   */
  public async dequeue(): Promise<Downloadable[]> {
    const downloads: Downloadable[] = [];
    while (!this.q.isEmpty()) {
      try {
        downloads.push(
          await this._get((await this.q.dequeue()) as Downloadable)
        );
      } catch (ex) {
        LOGGER.get(this.constructor.name).warning(`couldn't 'GET': ${ex}`);
      }
    }
    return Promise.resolve(downloads);
  }

  /**
   * Queues and immediately downloads (respecting the request rate limit) the
   * given collection of Downloadables.
   *
   * @param d Collection of Downloadables
   * @returns an array of string indicating the location in which the
   * downloadables were downloaded to.
   */
  public async get(...d: Downloadable[]): Promise<Downloadable[]> {
    this.queue(...d);
    return this.dequeue();
  }

  /**
   * Returns all the downloads or all the downloads with the specified extensions.
   *
   * @param extension the extension of the file including the '.' (dot)
   */
  public listDownloads(extension?: string): PathLike[] {
    return fs
      .readdirSync(this.dir)
      .map(f => path.join(this.dir.toString(), f.toString()))
      .filter(f => path.extname(f).toLowerCase() === (extension || ''));
  }

  /**
   * Private implementation that performs the actual HTTP.GET request.
   * @param d Downloadable to 'GET'
   *
   * @returns a promise that resolves to the location of the downloaded file
   */
  private async _get(d: Downloadable): Promise<Downloadable> {
    LOGGER.get(this.constructor.name).info(`downloading: ${d.url}`);
    DownloadManager.activeDownloads += 1;
    const p: Downloadable = {
      fileName: path.resolve(this.dir.toString(), d.fileName),
      url: d.url
    };
    const writer = fs.createWriteStream(p.fileName);

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
        LOGGER.get(this.constructor.name).info(`done writting: ${d.fileName}`);
        res(p);
      });
      writer.on('close', () =>
        LOGGER.get(this.constructor.name).debug(`closing ${d.fileName}`)
      );
      writer.on('error', () => {
        DownloadManager.activeFileWrites -= 1;
        LOGGER.get(this.constructor.name).error(
          `error while writting: ${d.fileName}`
        );
        rej();
      });
    });
  }

  private deldir(src: PathLike): void {
    if (!fs.existsSync(src)) return;

    fs.readdirSync(src).forEach(f => {
      const currentPath = path.join(src.toString(), f);
      if (fs.lstatSync(currentPath).isDirectory()) {
        this.deldir(currentPath); // recurse
      } else {
        fs.unlinkSync(currentPath); // delete file
      }
    });
    fs.rmdirSync(src);
  }
}

export default DownloadManager;
