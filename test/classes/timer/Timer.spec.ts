import { expect } from 'chai';
import Timer from '../../../src/classes/time/Timer';

describe('Timer test', () => {
  it('Should create timer', () => {
    const timer = new Timer(10);
    expect(timer).to.not.be.undefined;
  });

  it('Should wait at least 10 ms', async () => {
    const timer = new Timer(10);
    const start = Date.now();
    await timer.waitForTimeout();
    const end = Date.now();
    expect(end - start).to.be.greaterThan(10);
  });

  it('Should reset the timer', async () => {
    const timer = new Timer(10);
    await timer.waitForTimeout();
    expect(timer.isTimeout()).to.be.true;
    timer.reset();
    expect(timer.isTimeout()).to.be.false;
  });
});
