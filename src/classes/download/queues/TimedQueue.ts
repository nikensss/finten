import Downloadable from '../Downloadable';
import Queue from './Queue';
import Timer from '../../time/Timer';

/**
 * A TimedQueue is a type of queue from which elements can only be pulled out
 * with a certain time in between (with a timeout).
 *
 * Can be used in case a public API has a limit of requests per second.
 */
class TimedQueue implements Queue {
  private timer: Timer;
  private q: Downloadable[] = [];

  constructor(timeout: number) {
    this.timer = new Timer(timeout);
  }

  isEmpty(): boolean {
    return this.q.length === 0;
  }

  getTimer(): Timer {
    return this.timer;
  }

  queue(...d: Downloadable[]): void {
    this.q.push(...d);
  }

  /**
   * Return the first element of the queue with guarantees that the limit of
   * API calls per second won't be exceeded.
   */
  async dequeue(): Promise<Downloadable | undefined> {
    await this.timer.waitForTimeout();
    this.timer.reset();
    return this.q.shift();
  }
}

export default TimedQueue;
