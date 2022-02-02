import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import { anyNumber, anything, instance, mock, verify, when } from 'ts-mockito';
import { FinTenDB } from '../../../src/classes/db/FinTenDB';
import CompanyInfoModel from '../../../src/classes/db/models/CompanyInfo';
import FilingModel from '../../../src/classes/db/models/Filing';
import VisitedLinkModel, { VisitedLinkStatus } from '../../../src/classes/db/models/VisitedLink';
import { Downloadable } from '../../../src/classes/download/Downloadable.interface';
import { FilingMetadata } from '../../../src/classes/filings/FilingMetadata';
import { FinTen } from '../../../src/classes/finten/FinTen';
import SecGov from '../../../src/classes/secgov/SecGov';

chai.should();
chai.use(chaiAsPromised);

describe('FinTen tests', function () {
  this.slow(2500);
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading mongodb-memory-server', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      if (!FinTenDB.getInstance().isConnected()) {
        await FinTenDB.getInstance().disconnect();
        await FinTenDB.getInstance().connect(uri);
      }
      await FilingModel.ensureIndexes();
      await VisitedLinkModel.ensureIndexes();
      await CompanyInfoModel.ensureIndexes();
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    let disconnected = false;
    while (!disconnected) {
      disconnected = await mongod.stop();
    }
  });

  beforeEach(async () => {
    await FilingModel.ensureIndexes();
    await VisitedLinkModel.ensureIndexes();
    await CompanyInfoModel.ensureIndexes();
  });

  afterEach(async () => {
    if ((await FilingModel.countDocuments().exec()) > 0) {
      await FilingModel.collection.drop();
    }
    if ((await VisitedLinkModel.countDocuments().exec()) > 0) {
      await VisitedLinkModel.collection.drop();
    }
    if ((await CompanyInfoModel.countDocuments().exec()) > 0) {
      await CompanyInfoModel.collection.drop();
    }
  });

  it('should create a new FinTen', () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);
    expect(new FinTen(secgov, FinTenDB.getInstance())).to.not.be.undefined;
  });

  it('should create company info data', async () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);
    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.buildCompanyInfo(path.join(__dirname, 'company_info.csv'));

    expect(await CompanyInfoModel.countDocuments().exec()).to.equal(7);
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
    when(mockedSecGov.getFiling(anything()))
      .thenResolve({
        url: 'twin_disc_url',
        fileName: path.join(__dirname, 'twin_disc_10q.txt')
      })
      .thenResolve({
        url: 'amazon_url',
        fileName: path.join(__dirname, 'amazon_10k.txt')
      })
      .thenResolve({
        url: 'apple_url',
        fileName: path.join(__dirname, 'apple_10k.txt')
      });

    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.addNewFilings(1, 2);

    expect(await FilingModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      3
    );
    verify(mockedSecGov.getFiling(anything())).times(3);
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

    when(mockedSecGov.getFiling(anything()))
      .thenResolve({
        url: 'amazon_url',
        fileName: path.join(__dirname, 'amazon_10k.txt')
      })
      .thenResolve({
        url: 'apple_url',
        fileName: path.join(__dirname, 'apple_10k.txt')
      })
      .thenReject(new Error('Should not have been called a third time!'));

    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.addNewFilings(1, 2);

    expect(await FilingModel.countDocuments().exec()).to.equal(2);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(3);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      3
    );

    verify(mockedSecGov.getFiling(anything())).twice();
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
    when(mockedSecGov.getFiling(anything())).thenResolve({
      url: 'twin_disc_url',
      fileName: path.join(__dirname, 'ticker_ecik_map.txt')
    });

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
    verify(mockedSecGov.getFiling(anything())).times(1);
  });

  it('should retry problematic filings', async () => {
    const mockedSecGov = mock(SecGov);
    const secgov = instance(mockedSecGov);

    when(mockedSecGov.getFiling(anything()))
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_1');
        return Promise.resolve({
          url: 'url_with_error_1',
          fileName: path.join(__dirname, 'amazon_10k.txt')
        });
      })
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_2');
        return Promise.resolve({
          url: 'url_with_error_2',
          fileName: path.join(__dirname, 'apple_10k.txt')
        });
      })
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_3');
        return Promise.resolve({
          url: 'url_with_error_3',
          fileName: path.join(__dirname, 'costco_inc_10k.txt')
        });
      })
      .thenReject(new Error('Should not have been called a 4th time!'));

    await addVisitedLinksWithError();
    const finten = new FinTen(secgov, FinTenDB.getInstance());

    await finten.retryProblematicFilings();

    expect(await FilingModel.countDocuments().exec()).to.equal(3, 'Amount of filings differs');
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(4);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      4
    );

    verify(mockedSecGov.getFiling(anything())).times(3);
  });

  it('should retry problematic filings, fail the parsing and deal with it elegantly', async () => {
    const mockedSecGov: SecGov = mock(SecGov);
    const secgov: SecGov = instance(mockedSecGov);

    when(mockedSecGov.getFiling(anything()))
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_1');
        return Promise.resolve({
          url: 'url_with_error_1',
          fileName: path.join(__dirname, 'ticker_ecik_map.txt')
        });
      })
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_2');
        return Promise.resolve({
          url: 'url_with_error_2',
          fileName: path.join(__dirname, 'ticker_ecik_map.txt')
        });
      })
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.equal(1);
        expect(d[0].url).to.equal('url_with_error_3');
        return Promise.resolve([
          {
            url: 'url_with_error_3',
            fileName: path.join(__dirname, 'ticker_ecik_map.txt')
          }
        ]);
      })
      .thenReject(new Error('Should not have been called a 4th time!'));
    await addVisitedLinksWithError();
    const finten = new FinTen(secgov, FinTenDB.getInstance());
    await finten.retryProblematicFilings();

    expect(await FilingModel.countDocuments().exec()).to.equal(0);
    expect(await VisitedLinkModel.countDocuments().exec()).to.equal(4);
    expect(await VisitedLinkModel.countDocuments({ status: VisitedLinkStatus.OK }).exec()).to.equal(
      1
    );

    verify(mockedSecGov.getFiling(anything())).times(3);
  });
});

async function addDummyVisitedLinks(url: string) {
  await FinTenDB.getInstance().connect();
  await VisitedLinkModel.create({
    url,
    status: VisitedLinkStatus.OK,
    error: null,
    filingId: null
  });
}

async function addVisitedLinksWithError() {
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
