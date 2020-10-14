import Downloadable from './Downloadable';
import Queue from './queues/Queue';

interface Downloader {
  get(...d: Downloadable[]): Promise<Downloadable[]>;
  flush(): void;
  use(q: Queue): void;
}

export default Downloader;
