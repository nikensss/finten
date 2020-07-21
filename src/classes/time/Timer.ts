class Timer {
  private timeout: number;
  private start: number;
  constructor(timeout: number) {
    this.timeout = timeout;
    this.start = Date.now();
  }

  reset(): void {
    this.start = Date.now();
  }

  isTimeout(): boolean {
    return Date.now() - this.start > this.timeout;
  }

  async waitForTimeout(): Promise<void> {
    //if the timer is already timed out, immediately return;
    if (this.isTimeout()) return Promise.resolve();
    //else, wait the remaining time until timeout
    return await new Promise((res) =>
      setTimeout(res, this.timeout - (Date.now() - this.start))
    );
  }
}

export default Timer;
