import Downloadable from '../Downloadable';

interface Queue {
  empty: boolean;
  queue(...d: Downloadable[]): void;
  unqueue(): Promise<Downloadable | undefined>;
}

export default Queue;
