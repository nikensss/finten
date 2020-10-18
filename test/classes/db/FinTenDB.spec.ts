import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import TickerModel, { Ticker, TickerDocument } from '../../../src/classes/db/models/Ticker';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';
import { promises as fs } from 'fs';
import { fail } from 'assert';
import { FilingDocument } from '../../../src/classes/db/models/Filing';

chai.use(chaiAsPromised);

describe('FinTenDB tests', () => {
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
            db.insertFiling(xbrl.get());
          })
        );
      }
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  it('should insert one ticker', async () => {
    const ticker: Ticker = {
      TradingSymbol: 'FOO',
      EntityCentralIndexKey: 12345678
    };
    const db = await FinTenDB.getInstance().connect(uri);
    await db.insertTicker(ticker);

    TickerModel.countDocuments(ticker, (err, count) => {
      expect(count).to.be.equal(1);
    });
  });

  it('should retrieve one ticker', async () => {
    const ticker: Ticker = {
      TradingSymbol: 'FOO',
      EntityCentralIndexKey: 12345678
    };
    const db = await FinTenDB.getInstance().connect(uri);
    const dbTicker = await db.findTicker({
      EntityCentralIndexKey: 12345678
    });

    expect(dbTicker).to.not.be.null;
    expect(ticker.TradingSymbol).to.be.equal((dbTicker as TickerDocument).TradingSymbol);
  });

  it('should retrieve all filings', async () => {
    try {
      const EXPECTED_TOTAL = 40;
      let total = 0;
      const db = await FinTenDB.getInstance().connect(uri);

      await db.findFilings({}).eachAsync(() => {
        total += 1;
      });

      expect(total).to.be.equal(EXPECTED_TOTAL);
    } catch (ex) {
      fail(ex);
    }
  });

  it('should update tickers', async () => {
    try {
      const db = await FinTenDB.getInstance().connect(uri);

      await db.findFilings({}).eachAsync((filing: FilingDocument) => {
        filing.TradingSymbol = 'FOO';
        return filing.save();
      });

      await db.findFilings({}).eachAsync((filing: FilingDocument) => {
        expect(filing.TradingSymbol).to.be.equal('FOO');
      });
    } catch (ex) {
      fail(ex);
    }
  });
});
