import Downloadable from '../Downloadable';
import Queue from './Queue';

class DefaultQueue implements Queue {
  private q: Downloadable[] = [];

  isEmpty(): boolean {
    return this.q.length === 0;
  }

  queue(...d: Downloadable[]): void {
    this.q.push(...d);
  }

  async dequeue(): Promise<Downloadable | undefined> {
    return Promise.resolve(this.q.shift());
  }
}

export default DefaultQueue;