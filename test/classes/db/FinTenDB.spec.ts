import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';
import { promises as fs } from 'fs';
import { fail } from 'assert';
import FilingModel, { FilingDocument } from '../../../src/classes/db/models/Filing';
import CompanyInfoModel, { CompanyInfo } from '../../../src/classes/db/models/CompanyInfo';

chai.use(chaiAsPromised);

describe('FinTenDB tests', function () {
  this.slow(2500);

  let mongod: MongoMemoryServer, uri: string;

  before('before: loading memory DB', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      await FinTenDB.getInstance().connect(uri);

      await CompanyInfoModel.ensureIndexes();
      await FilingModel.ensureIndexes();
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await CompanyInfoModel.ensureIndexes();
    await FilingModel.ensureIndexes();
  });

  afterEach(async () => {
    if ((await CompanyInfoModel.countDocuments().exec()) > 0) {
      await CompanyInfoModel.collection.drop();
    }
    if ((await FilingModel.countDocuments().exec()) > 0) {
      await FilingModel.collection.drop();
    }
  });

  it('should insert one company info', async () => {
    const companyInfo: CompanyInfo = {
      EntityCentralIndexKey: 1234,
      StandardIndustrialClassification: 432,
      EntityRegistrantName: 'Company name',
      StateCountry: 'TX',
      Office: 'Office of Life Sciences',
      IndustryTitle: 'INDUSTRIAL INSTRUMENTS FOR MEASUREMENT, DISPLAY, AND CONTROL',
      TradingSymbol: 'TRSB'
    };
    await FinTenDB.getInstance().connect(uri);
    await new CompanyInfoModel(companyInfo).save();

    expect(await CompanyInfoModel.countDocuments(companyInfo).exec()).to.equal(1);
  });

  it('should retrieve 2 companies info', async () => {
    const companyInfoA: CompanyInfo = {
      EntityCentralIndexKey: 1234,
      StandardIndustrialClassification: 432,
      EntityRegistrantName: 'Company name',
      StateCountry: 'TX',
      Office: 'Office of Life Sciences',
      IndustryTitle: 'INDUSTRIAL INSTRUMENTS FOR MEASUREMENT, DISPLAY, AND CONTROL',
      TradingSymbol: 'TRSB-A'
    };
    const companyInfoB: CompanyInfo = {
      EntityCentralIndexKey: 1234,
      StandardIndustrialClassification: 432,
      EntityRegistrantName: 'Company name',
      StateCountry: 'TX',
      Office: 'Office of Life Sciences',
      IndustryTitle: 'INDUSTRIAL INSTRUMENTS FOR MEASUREMENT, DISPLAY, AND CONTROL',
      TradingSymbol: 'TRSB-B'
    };
    await FinTenDB.getInstance().connect(uri);
    const dbCompanyInfoA = await new CompanyInfoModel(companyInfoA).save();
    const dbCompanyInfoB = await new CompanyInfoModel(companyInfoB).save();

    expect(dbCompanyInfoA).to.not.be.null;
    expect(dbCompanyInfoB).to.not.be.null;

    const companies = await CompanyInfoModel.findByEntityCentralIndexKey(1234);
    expect(companies.length).to.be.equal(2);
  });

  it('should retrieve all filings', async () => {
    try {
      const EXPECTED_TOTAL = 40;
      let total = 0;

      await FinTenDB.getInstance().connect(uri);
      const files = (await fs.readdir(__dirname)).filter((f) => f.endsWith('_10k.txt'));
      const xbrls = await Promise.all(
        files.map((f) => XBRLUtilities.fromTxt(path.join(__dirname, f)))
      );
      for (let index = 0; index < 10; index++) {
        await Promise.all(xbrls.map((xbrl) => new FilingModel(xbrl.get()).save()));
      }

      await FilingModel.find()
        .cursor()
        .eachAsync(() => {
          total += 1;
        });

      expect(total).to.be.equal(EXPECTED_TOTAL);
    } catch (ex) {
      fail(ex);
    }
  });

  it('should update TradingSymbol', async () => {
    try {
      await FinTenDB.getInstance().connect(uri);

      const files = (await fs.readdir(__dirname)).filter((f) => f.endsWith('_10k.txt'));
      const xbrls = await Promise.all(
        files.map((f) => XBRLUtilities.fromTxt(path.join(__dirname, f)))
      );
      for (let index = 0; index < 10; index++) {
        await Promise.all(xbrls.map((xbrl) => new FilingModel(xbrl.get()).save()));
      }

      await FilingModel.find({})
        .cursor()
        .eachAsync(async (filing: FilingDocument) => {
          filing.TradingSymbol = 'FOO';
          return await filing.save();
        });

      await FilingModel.find({})
        .cursor()
        .eachAsync((filing: FilingDocument) => {
          expect(filing.TradingSymbol).to.equal('FOO');
        });
    } catch (ex) {
      fail(ex);
    }
  });
});
