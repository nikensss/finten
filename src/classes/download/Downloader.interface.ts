import Downloadable from './Downloadable.interface';
import Queue from './queues/Queue.interface';

interface Downloader {
  get(...d: Downloadable[]): Promise<Downloadable[]>;
  flush(): void;
  use(q: Queue): void;
}

export default Downloader;
