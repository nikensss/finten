import Downloadable from '../Downloadable';
import Queue from './Queue';

class TimedQueue implements Queue {
  private max: number;
  private _queue: Downloadable[] = [];

  constructor(max: number) {
    this.max = max;
  }

  queue(...d: Downloadable[]) {
    this._queue.push(...d);
  }

  get empty(): boolean {
    return this._queue.length === 0;
  }

  /**
   * Returns the minimum waiting time between two dequeuing requests.
   */
  get minPeriod() {
    return 1000 / this.max;
  }

  /**
   * Return the first element of the queue with guarantees that the limit of API calls per second won't be exceeded.
   */
  async dequeue(): Promise<Downloadable | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 1000 / this.max));
    return this._queue.shift();
  }
}

export default TimedQueue;
