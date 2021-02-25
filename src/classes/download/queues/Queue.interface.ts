interface Queue<T> {
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
  queue(...d: T[]): void;

  /**
   * Return the first element of the queue.
   */
  shift(): Promise<T>;

  /**
   * Empties the queue
   */
  flush(): void;

  pop(): Promise<T>;
}

export default Queue;
