import fs, { PathLike } from 'fs';
import path from 'path';
import axios from 'axios';
import Downloadable from './Downloadable';
import Queue from './queues/Queue';
import DefaultQueue from './queues/DefaultQueue';
import { default as LOGGER } from '../logger/DefaultLogger';
import Downloader from './Downloader';

class DownloadManager implements Downloader {
  private _directory: PathLike;
  private static _activeDownloads = 0;
  private static _activeFileWrites = 0;
  private q: Queue;

  constructor(directory: PathLike = 'finten_downloads') {
    this._directory = directory;

    if (!fs.existsSync(this.dir)) {
      this.logger.info(`directory '${this.dir}' doesn't exist, creating...`);
      fs.mkdirSync(this.dir);
      this.logger.info('creation successful!');
    }

    this.q = new DefaultQueue();
  }

  public use(q: Queue): void {
    this.q = q;
  }

  public get dir(): PathLike {
    return this._directory;
  }

  private static get fileWrites(): number {
    return DownloadManager._activeFileWrites;
  }

  private static set fileWrites(amount: number) {
    DownloadManager._activeFileWrites = amount;
    LOGGER.get(DownloadManager.name).info(
      `active file writes: ${DownloadManager._activeFileWrites}`
    );
  }

  private static get downloads(): number {
    return DownloadManager._activeDownloads;
  }

  private static set downloads(amount: number) {
    DownloadManager._activeDownloads = amount;
    LOGGER.get(DownloadManager.name).info(`active downloads: ${DownloadManager._activeDownloads}`);
  }

  public flush(): void {
    this.logger.info('flushing downloads! 🚾');
    fs.readdirSync(this.dir).forEach((f) => {
      const currentPath = path.join(this.dir.toString(), f);
      if (fs.lstatSync(currentPath).isDirectory()) {
        this.deleteDirectory(currentPath);
      }
      this.logger.debug(`deleting ${f}`);
      fs.unlinkSync(currentPath);
    });
    this.logger.info('done flusing 🚽');
  }

  public queue(...d: Downloadable[]): void {
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
        const gettable = await this.q.shift();
        const downloadedElement = await this._get(gettable);
        downloads.push(downloadedElement);
      } catch (ex) {
        this.logger.warning(`couldn't 'GET': ${ex}`);
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
      .map((f) => path.join(this.dir.toString(), f.toString()))
      .filter((f) => path.extname(f).toLowerCase() === (extension || ''));
  }

  /**
   * Private implementation that performs the actual HTTP.GET request.
   * @param d Downloadable to 'GET'
   *
   * @returns a promise that resolves to the location of the downloaded file
   */
  private async _get(d: Downloadable): Promise<Downloadable> {
    this.logger.info(`downloading: ${d.url}`);
    DownloadManager.downloads += 1;
    const p: Downloadable = {
      fileName: path.join(this.dir.toString(), d.fileName),
      url: d.url
    };

    this.logger.info('await for axios...');
    const response = await axios({
      url: d.url,
      method: 'GET',
      responseType: 'stream'
    });
    this.logger.info(`axios finished with status ${response.status}`);
    console.log(response.data);
    DownloadManager.downloads -= 1;

    DownloadManager.fileWrites += 1;
    const writer = fs.createWriteStream(p.fileName);
    writer.on('pipe', () => this.logger.info('💈 piping to writer'));

    const promise: Promise<Downloadable> = new Promise((res, rej) => {
      writer.on('finish', () => {
        this.logger.info(`✅ done writting: ${d.fileName}`);
        res(p);
      });

      writer.on('close', () => {
        DownloadManager.fileWrites -= 1;
        this.logger.info(`closing ${d.fileName}`);
      });

      writer.on('error', () => {
        this.logger.error(`❌ error while writting: ${d.fileName}`);
        rej();
      });
    });

    response.data.on('error', (error: Error) => {
      writer.close();
      this.logger.error(`❌ Error when getting ${d.url}:`);
      console.error(error);
    });

    response.data.pipe(writer);
    this.logger.info('starting pipe');
    return await promise;
  }

  private deleteDirectory(src: PathLike): void {
    if (!fs.existsSync(src)) return;

    fs.readdirSync(src).forEach((f) => {
      const currentPath = path.join(src.toString(), f);
      if (fs.lstatSync(currentPath).isDirectory()) {
        this.deleteDirectory(currentPath); // recurse
      } else {
        fs.unlinkSync(currentPath); // delete file
      }
    });
    fs.rmdirSync(src);
  }

  private get logger() {
    return LOGGER.get(this.constructor.name);
  }
}

export default DownloadManager;
