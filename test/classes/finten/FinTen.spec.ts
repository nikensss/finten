import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import FinTen from '../../../src/classes/finten/FinTen';

describe('FinTen tests', () => {
  it('should create a new FinTen', () => {
    expect(FinTen.create()).to.not.be.undefined;
  });

  it('should not create a new FinTen', () => {
    let downloadsDirectoryBackup: any;
    if (process.env.DOWNLOADS_DIRECTORY) {
      downloadsDirectoryBackup = process.env.DOWNLOADS_DIRECTORY;
      delete process.env.DOWNLOADS_DIRECTORY;
    } else {
      throw new Error(
        'Cannot run test because env variables are not properly set!'
      );
    }
    expect(() => FinTen.create()).to.throw('No DOWNLOADS_DIRECTORY in .env');
    if (typeof downloadsDirectoryBackup === 'string') {
      process.env.DOWNLOADS_DIRECTORY = downloadsDirectoryBackup;
    }
  });
});
