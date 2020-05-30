import Downloadable from '../Downloadable';

interface Queue {
  /**
   * Indicates whether the queue is empty.
   * 
   */
  isEmpty(): boolean;

  /**
   * Adds the given elements to the queue.
   * 
   * @param d Element to be added to the queue
   */
  queue(...d: Downloadable[]): void;

  /**
   * Return the first element of the queue.
   */
  dequeue(): Promise<Downloadable | undefined>;
}

export default Queue;
