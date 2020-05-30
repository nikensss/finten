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
    return await new Promise(res => setTimeout(res, this.timeout));
  }
}

export default Timer;