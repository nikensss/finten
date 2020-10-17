import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import TickerModel, {
  Ticker,
  TickerDocument
} from '../../../src/classes/db/models/Ticker';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';
import { promises as fs } from 'fs';
import { fail, match } from 'assert';

chai.use(chaiAsPromised);

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

describe('FinTenDB tests', () => {
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
    expect(ticker.TradingSymbol).to.be.equal(
      (dbTicker as TickerDocument).TradingSymbol
    );
  });

  it('should retrieve all filings', async () => {
    const db = await FinTenDB.getInstance().connect(uri);
    const filings = await db.findFilings({});

    expect(filings.length).to.be.equal(4);
  });

  it('should update tickers', async () => {
    const db = await FinTenDB.getInstance().connect(uri);
    const filings = await db.findFilings({});

    try {
      const promises = filings.map((f) =>
        db.updateFilings(f, { TradingSymbol: 'FOO' })
      );
      await Promise.all(promises);
      const newFilings = await db.findFilings({});
      newFilings.forEach((f) => {
        expect(f.TradingSymbol).to.be.equal('FOO');
      });
    } catch (ex) {
      fail(ex);
    }
  });
});
