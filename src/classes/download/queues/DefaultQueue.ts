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

  async shift(): Promise<Downloadable> {
    const next = this.q.shift();
    if (typeof next === 'undefined') {
      throw new Error('Empty queue');
    }
    return Promise.resolve(next);
  }
}

export default DefaultQueue;
