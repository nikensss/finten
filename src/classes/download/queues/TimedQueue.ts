import Queue from './Queue.interface';
import Timer from '../../time/Timer';

/**
 * A TimedQueue is a type of queue from which elements can only be pulled out
 * with a certain time in between (with a timeout).
 *
 * Can be used in case a public API has a limit of requests per second.
 */
class TimedQueue<T> implements Queue<T> {
  private timer: Timer;
  private q: T[] = [];

  constructor(timeout: number) {
    this.timer = new Timer(timeout);
  }

  isEmpty(): boolean {
    return this.q.length === 0;
  }

  getTimer(): Timer {
    return this.timer;
  }

  queue(...d: T[]): void {
    this.q.push(...d);
  }

  flush(): void {
    this.q = [];
  }

  /**
   * Return the first element of the queue with guarantees that the limit of
   * API calls per second won't be exceeded.
   */
  async shift(): Promise<T> {
    const next = this.q.shift();
    if (typeof next === 'undefined') {
      throw new Error('Empty queue');
    }
    await this.timer.waitForTimeout();
    this.timer.reset();
    return next;
  }

  async pop(): Promise<T> {
    const last = this.q.pop();
    if (typeof last === 'undefined') {
      throw new Error('Empty queue');
    }
    await this.timer.waitForTimeout();
    this.timer.reset();
    return last;
  }
}

export default TimedQueue;
