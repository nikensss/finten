import chai, { expect } from 'chai';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import DownloadManager from '../../../src/classes/download/DownloadManager';
import chaiAsPromised from 'chai-as-promised';
import FinTen from '../../../src/classes/finten/FinTen';
import SecGov from '../../../src/classes/secgov/SecGov';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';
import { promises as fs } from 'fs';
import TickerModel, { Ticker } from '../../../src/classes/db/models/Ticker';
import { FilingDocument } from '../../../src/classes/db/models/Filing';
import { fail } from 'assert';
import { instance, mock, when } from 'ts-mockito';

chai.should();
chai.use(chaiAsPromised);

describe('FinTen tests', function () {
  this.slow(750);
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading mongodb-memory-server', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      const db = await FinTenDB.getInstance().connect(uri);

      const files = (await fs.readdir(__dirname)).filter((f) => f.endsWith('10k.txt'));
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
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);
    expect(new FinTen(secgov, FinTenDB.getInstance())).to.not.be.undefined;
  });

  it('should build ECIK map', async () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);

    when(mockedSecGov.getEntityCentralIndexKeyMap()).thenResolve([
      {
        url: 'https://www.sec.gov/include/ticker.txt',
        fileName: path.join(__dirname, 'ticker_ecik_map.txt')
      }
    ]);
    const finten = new FinTen(secgov, FinTenDB.getInstance());

    await finten.buildEntityCentralIndexKeyMap();

    const tickers: Ticker[] = [
      { TradingSymbol: 'AAPL', EntityCentralIndexKey: 320193 },
      { TradingSymbol: 'AMZN', EntityCentralIndexKey: 1018724 },
      { TradingSymbol: 'MSFT', EntityCentralIndexKey: 789019 },
      { TradingSymbol: 'GOOG', EntityCentralIndexKey: 1652044 }
    ];

    for (const t of tickers) {
      const r = await TickerModel.finByEntityCentralIndexKey(t.EntityCentralIndexKey);
      if (r === null) throw new Error('Ticker could not be found');
      expect(r.TradingSymbol).to.equal(t.TradingSymbol);
      expect(r.EntityCentralIndexKey).to.equal(t.EntityCentralIndexKey);
    }
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
