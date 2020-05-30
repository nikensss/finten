import Downloadable from '../Downloadable';

interface Queue {
  empty: boolean;
  queue(...d: Downloadable[]): void;
  dequeue(): Promise<Downloadable | undefined>;
}

export default Queue;
