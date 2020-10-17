import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import DownloadManager from '../../../src/classes/download/DownloadManager';
// import chaiAsPromised from 'chai-as-promised';
import FinTen from '../../../src/classes/finten/FinTen';
import SecGov from '../../../src/classes/secgov/SecGov';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';
import { promises as fs } from 'fs';

let mongod: MongoMemoryServer, uri: string;

before(async () => {
  mongod = new MongoMemoryServer();
  try {
    uri = await mongod.getUri();
    const db = await FinTenDB.getInstance().connect(uri);

    const files = (await fs.readdir(__dirname)).filter((f) =>
      f.endsWith('.txt')
    );
    const xbrls = await Promise.all(
      files.map((f) => XBRLUtilities.fromTxt(path.join(__dirname, f)))
    );
    await Promise.all(
      xbrls.map((xbrl) => {
        db.insertFiling(xbrl.get());
      })
    );
  } catch (ex) {
    throw ex;
  }
});

after(async () => {
  await FinTenDB.getInstance().disconnect();
  await mongod.stop();
});

describe('FinTen tests', () => {
  it('should create a new FinTen', () => {
    expect(new FinTen(new SecGov(new DownloadManager()))).to.not.be.undefined;
  });
});
