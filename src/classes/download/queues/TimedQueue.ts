import Downloadable from '../Downloadable';
import Queue from './Queue';
import Timer from '../../time/Timer';
import chalk from 'chalk';

/**
 * A TimedQueue is a type of queue from which elements can only be pulled out
 * with a certain time in between (with a timeout).
 *
 * Can be used in case a public API has a limit of requests per second.
 */
class TimedQueue implements Queue {
  private timer: Timer;
  private _queue: Downloadable[] = [];

  constructor(timeout: number) {
    this.timer = new Timer(timeout);
  }

  queue(...d: Downloadable[]) {
    this._queue.push(...d);
  }

  isEmpty(): boolean {
    return this._queue.length === 0;
  }

  /**
   * Return the first element of the queue with guarantees that the limit of API calls per second won't be exceeded.
   */
  async dequeue(): Promise<Downloadable | undefined> {
    const now = Date.now();
    await this.timer.waitForTimeout();
    //console.log(chalk.bgRed(`[TimedQueue] Δt: ${Date.now() - now}`));
    this.timer.reset();
    return this._queue.shift();
  }
}

export default TimedQueue;
