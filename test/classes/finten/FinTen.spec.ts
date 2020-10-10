import { expect } from 'chai';
import DownloadManager from '../../../src/classes/download/DownloadManager';
// import chaiAsPromised from 'chai-as-promised';
import FinTen from '../../../src/classes/finten/FinTen';
import SecGov from '../../../src/classes/secgov/SecGov';

describe('FinTen tests', () => {
  it('should create a new FinTen', () => {
    expect(new FinTen(new SecGov(new DownloadManager()))).to.not.be.undefined;
  });
});
