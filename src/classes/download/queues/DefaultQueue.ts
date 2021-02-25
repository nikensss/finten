import Queue from './Queue.interface';

class DefaultQueue<T> implements Queue<T> {
  private q: T[] = [];

  isEmpty(): boolean {
    return this.q.length === 0;
  }

  queue(...d: T[]): void {
    this.q.push(...d);
  }

  flush(): void {
    this.q = [];
  }

  async shift(): Promise<T> {
    const next = this.q.shift();
    if (typeof next === 'undefined') {
      throw new Error('Empty queue');
    }
    return Promise.resolve(next);
  }

  async pop(): Promise<T> {
    const last = this.q.pop();
    if (typeof last === 'undefined') {
      throw new Error('Empty queue');
    }
    return Promise.resolve(last);
  }
}

export default DefaultQueue;
