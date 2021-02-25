import Queue from './queues/Queue.interface';

interface Downloader<T> {
  get(d: T): Promise<T>;
  flush(): void;
  use(q: Queue<T>): void;
}

export default Downloader;
