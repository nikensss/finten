import Downloadable from '../Downloadable.interface';
import Queue from './Queue.interface';

class DefaultQueue implements Queue {
  private q: Downloadable[] = [];

  isEmpty(): boolean {
    return this.q.length === 0;
  }

  queue(...d: Downloadable[]): void {
    this.q.push(...d);
  }

  flush(): void {
    this.q = [];
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
