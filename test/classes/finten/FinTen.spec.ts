import { expect } from 'chai';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import DownloadManager from '../../../src/classes/download/DownloadManager';
// import chaiAsPromised from 'chai-as-promised';
import FinTen from '../../../src/classes/finten/FinTen';
import SecGov from '../../../src/classes/secgov/SecGov';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';
import { promises as fs } from 'fs';
import { Ticker } from '../../../src/classes/db/models/Ticker';
import { FilingDocument } from '../../../src/classes/db/models/Filing';
import { fail } from 'assert';

describe('FinTen tests', () => {
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading memory DB', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      const db = await FinTenDB.getInstance().connect(uri);

      const files = (await fs.readdir(__dirname)).filter((f) => f.endsWith('.txt'));
      const xbrls = await Promise.all(
        files.map((f) => XBRLUtilities.fromTxt(path.join(__dirname, f)))
      );
      for (let index = 0; index < 10; index++) {
        await Promise.all(
          xbrls.map((xbrl) => {
            db.createFiling(xbrl.get());
          })
        );
      }

      const tickers: Ticker[] = [
        { TradingSymbol: 'AMZN', EntityCentralIndexKey: 1018724 },
        { TradingSymbol: 'CNBX', EntityCentralIndexKey: 1343009 },
        { TradingSymbol: 'COST', EntityCentralIndexKey: 1621199 },
        { TradingSymbol: 'GOOG', EntityCentralIndexKey: 1652044 }
      ];
      await Promise.all(tickers.map((t) => db.createTicker(t)));
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  it('should create a new FinTen', () => {
    expect(new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance())).to.not.be
      .undefined;
  });

  it('should fix tickers', async () => {
    const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());

    await finten.fixTickers();

    await finten.db.findFilings({}).eachAsync(async (filing: FilingDocument) => {
      const ticker = await finten.db.findTicker({
        EntityCentralIndexKey: parseInt(filing.EntityCentralIndexKey)
      });

      if (!ticker) {
        fail('Please, add the tickers to the mongodb-memory-server!');
      }

      expect(filing.TradingSymbol).to.be.equal(ticker.TradingSymbol);
    });
  });
});
