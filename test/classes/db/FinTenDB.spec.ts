import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import TickerModel, { Ticker } from '../../../src/classes/db/models/Ticker';

chai.use(chaiAsPromised);

let mongod: MongoMemoryServer, uri: string;

before(async () => {
  mongod = new MongoMemoryServer();
  uri = await mongod.getUri();
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
      mongod.stop();
    });
  });
});
