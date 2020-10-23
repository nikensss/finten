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
import VisitedLinkModel, { VisitedLinkStatus } from '../../../src/classes/db/models/VisitedLink';
import FilingModel, { FilingDocument } from '../../../src/classes/db/models/Filing';
import { fail } from 'assert';
import { anyNumber, anything, instance, mock, verify, when } from 'ts-mockito';
import FilingMetadata from '../../../src/classes/filings/FilingMetadata';
import Downloadable from '../../../src/classes/download/Downloadable';

chai.should();
chai.use(chaiAsPromised);

describe('FinTen tests', function () {
  this.slow(2500);
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading mongodb-memory-server', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      await FinTenDB.getInstance().connect(uri);
      await TickerModel.ensureIndexes();
      await FilingModel.ensureIndexes();
      await VisitedLinkModel.ensureIndexes();
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await TickerModel.ensureIndexes();
    await FilingModel.ensureIndexes();
    await VisitedLinkModel.ensureIndexes();
  });

  afterEach(async () => {
    if ((await TickerModel.countDocuments().exec()) > 0) {
      await TickerModel.collection.drop();
    }
    if ((await FilingModel.countDocuments().exec()) > 0) {
      await FilingModel.collection.drop();
    }
    if ((await VisitedLinkModel.countDocuments().exec()) > 0) {
      await VisitedLinkModel.collection.drop();
    }
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

  it('should detect a duplicate ticker insertion attempt and then not add it', async () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);

    when(mockedSecGov.getEntityCentralIndexKeyMap()).thenResolve([
      {
        url: 'https://www.sec.gov/include/ticker.txt',
        fileName: path.join(__dirname, 'ticker_ecik_map_with_duplicates.txt')
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
    await addDummyFilingsAndTickers();
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

  it('should not be able to find a Ticker when fixing tickers', async () => {
    await addDummyFilings();
    const db = await FinTenDB.getInstance().connect();
    const tickers: Ticker[] = [{ TradingSymbol: 'AAPL', EntityCentralIndexKey: 1192838 }];
    await Promise.all(tickers.map((t) => db.createTicker(t)));
    const finten = new FinTen(new SecGov(new DownloadManager()), FinTenDB.getInstance());

    await finten.fixTickers();

    await finten.db.findFilings({}).eachAsync(async (filing: FilingDocument) => {
      const ticker = await finten.db.findTicker({
        EntityCentralIndexKey: parseInt(filing.EntityCentralIndexKey)
      });

      expect(ticker).to.be.null;
    });
  });

  it('should add new filings', async () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);

    when(mockedSecGov.getIndices(anyNumber(), anyNumber())).thenResolve([
      {
        url: 'anyurl',
        fileName: path.join(__dirname, 'xbrl.idx')
      }
    ]);
    when(mockedSecGov.parseIndices(anything(), anything())).thenReturn([
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|a_url'),
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|another_url'),
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|yet_another_url')
    ]);
    when(mockedSecGov.getFilings(anything()))
      .thenResolve([
        {
          url: 'twin_disc_url',
          fileName: path.join(__dirname, 'twin_disc_10q.txt')
        }
      ])
      .thenResolve([
        {
          url: 'amazon_url',
          fileName: path.join(__dirname, 'amazon_10k.txt')
        }
      ])
      .thenResolve([
        {
          url: 'google_url',
          fileName: path.join(__dirname, 'google_10k.txt')
        }
      ]);

    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.addNewFilings(1, 2);

    expect(await FilingModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      3
    );
    verify(mockedSecGov.getFilings(anything())).times(3);
  });

  it('should add less filings because there are visited links', async () => {
    await addDummyVisitedLinks(`${SecGov.FILINGS_ROOT}a_known_url`);
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);

    when(mockedSecGov.getIndices(anyNumber(), anyNumber())).thenResolve([
      {
        url: 'anyurl',
        fileName: path.join(__dirname, 'xbrl.idx')
      }
    ]);

    when(mockedSecGov.parseIndices(anything(), anything())).thenReturn([
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|a_known_url'),
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|another_url'),
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|yet_another_url')
    ]);

    when(mockedSecGov.getFilings(anything()))
      .thenResolve([
        {
          url: 'amazon_url',
          fileName: path.join(__dirname, 'amazon_10k.txt')
        }
      ])
      .thenResolve([
        {
          url: 'google_url',
          fileName: path.join(__dirname, 'google_10k.txt')
        }
      ])
      .thenReject(new Error('Should not have been called a third time!'));

    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.addNewFilings(1, 2);

    expect(await FilingModel.countDocuments().exec()).to.equal(2);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      3
    );

    verify(mockedSecGov.getFilings(anything())).twice();
  });

  it('should retry problematic filings', async () => {
    const mockedSecGov = mock(SecGov);
    const secgov = instance(mockedSecGov);

    when(mockedSecGov.getFilings(anything()))
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_1');
        return Promise.resolve([
          {
            url: 'url_with_error_1',
            fileName: path.join(__dirname, 'amazon_10k.txt')
          }
        ]);
      })
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_2');
        return Promise.resolve([
          {
            url: 'url_with_error_2',
            fileName: path.join(__dirname, 'google_10k.txt')
          }
        ]);
      })
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_3');
        return Promise.resolve([
          {
            url: 'url_with_error_3',
            fileName: path.join(__dirname, 'costco_inc_10k.txt')
          }
        ]);
      })
      .thenReject(new Error('Should not have been called a 4th time!'));

    await addVsitedLinksWithError();
    const finten = new FinTen(secgov, FinTenDB.getInstance());

    await finten.retryProblematicFilings();

    expect(await FilingModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(4);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      4
    );

    verify(mockedSecGov.getFilings(anything())).times(3);
  });

  it('should add a VisitedLink with error when adding new filings and XBRL cannot be parsed', async () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);

    when(mockedSecGov.getIndices(anyNumber(), anyNumber())).thenResolve([
      {
        url: 'anyurl',
        fileName: path.join(__dirname, 'xbrl.idx')
      }
    ]);
    when(mockedSecGov.parseIndices(anything(), anything())).thenReturn([
      new FilingMetadata('320193|Apple Inc.|10-Q|2020-01-29|a_url')
    ]);
    when(mockedSecGov.getFilings(anything())).thenResolve([
      {
        url: 'twin_disc_url',
        fileName: path.join(__dirname, 'ticker_ecik_map.txt')
      }
    ]);

    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.addNewFilings(1, 2);

    expect(await FilingModel.countDocuments().exec()).to.equal(0);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(1);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      0
    );
    expect(
      await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.ERROR }).exec()
    ).to.equal(1);
    verify(mockedSecGov.getFilings(anything())).times(1);
  });
});

async function addDummyFilingsAndTickers() {
  await addDummyFilings();
  await addDummyTickers();
}

async function addDummyFilings() {
  const db = await FinTenDB.getInstance().connect();
  const files = (await fs.readdir(__dirname)).filter((f) => f.endsWith('10k.txt'));
  const xbrls = await Promise.all(files.map((f) => XBRLUtilities.fromTxt(path.join(__dirname, f))));
  for (let index = 0; index < 10; index++) {
    await Promise.all(
      xbrls.map((xbrl) => {
        db.createFiling(xbrl.get());
      })
    );
  }
}

async function addDummyTickers() {
  const db = await FinTenDB.getInstance().connect();
  const tickers: Ticker[] = [
    { TradingSymbol: 'AMZN', EntityCentralIndexKey: 1018724 },
    { TradingSymbol: 'CNBX', EntityCentralIndexKey: 1343009 },
    { TradingSymbol: 'COST', EntityCentralIndexKey: 1621199 },
    { TradingSymbol: 'GOOG', EntityCentralIndexKey: 1652044 }
  ];
  await Promise.all(tickers.map((t) => db.createTicker(t)));
}

async function addDummyVisitedLinks(url: string) {
  await FinTenDB.getInstance().connect();
  await VisitedLinkModel.create({
    url,
    status: VisitedLinkStatus.OK,
    error: null,
    filingId: null
  });
}

async function addVsitedLinksWithError() {
  await FinTenDB.getInstance().connect();
  await VisitedLinkModel.create({
    url: 'url_with_error_1',
    status: VisitedLinkStatus.ERROR,
    error: 'Error parsing xbrl: No year end found!',
    filingId: null
  });
  await VisitedLinkModel.create({
    url: 'url_with_error_2',
    status: VisitedLinkStatus.ERROR,
    error: 'Error parsing xbrl: No year end found!',
    filingId: null
  });
  await VisitedLinkModel.create({
    url: 'url_with_error_3',
    status: VisitedLinkStatus.ERROR,
    error: 'Error parsing xbrl: No year end found!',
    filingId: null
  });
  await VisitedLinkModel.create({
    url: 'url_with_no_error_3',
    status: VisitedLinkStatus.OK,
    error: null,
    filingId: null
  });
}
