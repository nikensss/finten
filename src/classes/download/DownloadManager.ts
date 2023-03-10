import axios, { AxiosPromise } from 'axios';
import fs, { PathLike } from 'fs';
import path from 'path';
import { default as LOGGER } from '../logger/DefaultLogger';
import { Logger } from '../logger/Logger.interface';
import { Downloadable } from './Downloadable.interface';
import Downloader from './Downloader.interface';
import DefaultQueue from './queues/DefaultQueue';
import Queue from './queues/Queue.interface';

class DownloadManager implements Downloader<Downloadable> {
  private _directory: PathLike;
  private static _activeDownloads = 0;
  private static _activeFileWrites = 0;
  private q: Queue<Downloadable>;
  private logger: Logger = LOGGER.get(this.constructor.name);

  constructor(directory: PathLike = 'finten_downloads') {
    this._directory = directory;

    if (!fs.existsSync(this.dir)) {
      this.logger.info(`directory '${this.dir}' doesn't exist, creating...`);
      fs.mkdirSync(this.dir);
      this.logger.info('creation successful!');
    }

    this.q = new DefaultQueue<Downloadable>();
  }

  public use(q: Queue<Downloadable>): void {
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

  public flush(): void {
    this.logger.info('flushing downloads! ????');
    fs.readdirSync(this.dir).forEach((f) => {
      const currentPath = path.join(this.dir.toString(), f);
      if (fs.lstatSync(currentPath).isDirectory()) {
        this.deleteDirectory(currentPath);
      }
      this.logger.debug(`deleting ${f}`);
      fs.unlinkSync(currentPath);
    });
    this.logger.info('done flushing ????');
  }

  /**
   * Queues and immediately downloads (respecting the request rate limit) the
   * given collection of Downloadables.
   *
   * @param d Collection of Downloadables
   * @returns an array of string indicating the location in which the
   * downloadables were downloaded to.
   */
  public async get(d: Downloadable): Promise<Downloadable> {
    this.q.queue(d);
    return this._get(await this.q.pop());
  }

  public queue(...d: Downloadable[]): void {
    this.q.queue(...d);
  }

  /**
   * Starts emptying the queue by 'GET'-ting all the elements in it.
   *
   * @returns a promise that resolves to the locations of where the downloadables
   * were downloaded to.
   */
  public async dequeue(): Promise<Downloadable[]> {
    const downloads: Downloadable[] = [];
    while (!this.q.isEmpty()) {
      try {
        const downloadable = await this.q.shift();
        const downloadedElement = await this._get(downloadable);
        downloads.push(downloadedElement);
      } catch (ex) {
        this.logger.warning(`couldn't 'GET': ${ex}`);
      }
    }
    return Promise.resolve(downloads);
  }

  /**
   * Private implementation that performs the actual HTTP.GET request.
   * @param d Downloadable to 'GET'
   *
   * @returns a promise that resolves to the location of the downloaded file
   */
  private async _get(d: Downloadable): Promise<Downloadable> {
    this.logger.info(`downloading: ${d.url}`);

    try {
      DownloadManager.fileWrites += 1;
      const response = await this.download(d.url);
      if (response.status !== 200) throw new Error(`${d.url} responded with ${response.status}`);
      return await this.writeStream(response.data, d);
    } catch (e) {
      throw new Error(`Error while writing stream: ${e.toString()}`);
    } finally {
      DownloadManager.fileWrites -= 1;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async download(url: string): Promise<AxiosPromise<any>> {
    try {
      DownloadManager.downloads += 1;
      this.logger.info('await for axios...');

      const r = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
      this.logger.info(`axios finished with status ${r.status}`);

      return r;
    } finally {
      DownloadManager.downloads -= 1;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async writeStream(data: any, downloadable: Downloadable): Promise<Downloadable> {
    const downloadedFile: Downloadable = {
      fileName: path.join(this.dir.toString(), downloadable.fileName),
      url: downloadable.url,
      toString: () => downloadable.toString()
    };

    const writer = fs.createWriteStream(downloadedFile.fileName);
    const promise: Promise<Downloadable> = new Promise((res, rej) => {
      writer
        .on('pipe', () => this.logger.info('???? piping to writer'))
        .on('close', () => {
          this.logger.info(`??? done writing, closing: ${downloadable.fileName}`);
          res(downloadedFile);
        })
        .on('error', (error) => {
          this.logger.error(`??? error while writing: ${downloadable.fileName}`);
          rej(error);
        });

      setTimeout(() => rej(new Error('timeout')), 5 * 60 * 1000);
    });

    data.pipe(writer);

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
}

export default DownloadManager;
