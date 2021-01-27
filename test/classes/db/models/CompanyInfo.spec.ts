import path from 'path';
import { fail } from 'assert';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../../src/classes/db/FinTenDB';
import CompanyInfoModel, { CompanyInfo } from '../../../../src/classes/db/models/CompanyInfo';

chai.should();
chai.use(chaiAsPromised);

describe('CompanyInfo model tests', function () {
  this.slow(300);

  let mongod: MongoMemoryServer, uri: string;

  before('before: loading memory DB', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      if (!FinTenDB.getInstance().isConnected()) {
        await FinTenDB.getInstance().disconnect();
        await FinTenDB.getInstance().connect(uri);
      }
      await CompanyInfoModel.ensureIndexes();
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
  });

  afterEach(async () => {
    if ((await CompanyInfoModel.countDocuments().exec()) > 0) {
      await CompanyInfoModel.collection.drop();
    }
  });

  it('should create a new company info document', async () => {
    try {
      const companyInfo: CompanyInfo = {
        EntityCentralIndexKey: 1234,
        StandardIndustrialClassification: 432,
        EntityRegistrantName: 'Company name',
        StateCountry: 'TX',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'INDUSTRIAL INSTRUMENTS FOR MEASUREMENT, DISPLAY, AND CONTROL',
        TradingSymbol: 'TRSB'
      };
      const companyInfoDoc = await new CompanyInfoModel(companyInfo).save();

      expect(companyInfoDoc.EntityCentralIndexKey).to.equal(companyInfo.EntityCentralIndexKey);
      expect(companyInfoDoc.StandardIndustrialClassification).to.equal(
        companyInfo.StandardIndustrialClassification
      );
      expect(companyInfoDoc.EntityRegistrantName).to.equal(companyInfo.EntityRegistrantName);
      expect(companyInfoDoc.StateCountry).to.equal(companyInfo.StateCountry);
      expect(companyInfoDoc.Office).to.equal(companyInfo.Office);
      expect(companyInfoDoc.IndustryTitle).to.equal(companyInfo.IndustryTitle);
      expect(companyInfoDoc.TradingSymbol).to.equal(companyInfo.TradingSymbol);
    } catch (ex) {
      fail(ex);
    }
  });

  it('should parse 7 companies from file', async () => {
    const companies = await CompanyInfoModel.parseFile(path.join(__dirname, 'company_info.csv'));
    for (const company of companies) {
      const doc = await new CompanyInfoModel(company).save();
      expect(doc).to.not.be.undefined;
    }
    expect(await CompanyInfoModel.countDocuments().exec()).to.equal(7);
  });

  it('should not be able to parse file because one line has missing columns', async () => {
    return CompanyInfoModel.parseFile(
      path.join(__dirname, 'company_info_invalid_data.csv')
    ).should.be.rejectedWith('Cannot parse! Missing data!');
  });

  it('should find by TradingSymbol', async () => {
    const companies = await CompanyInfoModel.parseFile(path.join(__dirname, 'company_info.csv'));
    for (const company of companies) {
      const doc = await new CompanyInfoModel(company).save();
      expect(doc).to.not.be.undefined;
    }
    expect(await CompanyInfoModel.findByTradingSymbol('AAPL')).to.not.be.undefined;
  });

  it('should find several Companies with one ECIK but different TradingSymbol', async () => {
    const companies = await CompanyInfoModel.parseFile(path.join(__dirname, 'company_info.csv'));
    for (const company of companies) {
      const doc = await new CompanyInfoModel(company).save();
      expect(doc).to.not.be.undefined;
    }
    const brks = await CompanyInfoModel.findByEntityCentralIndexKey(1067983);
    expect(brks.length).to.equal(2);
    expect(brks[0].TradingSymbol).to.not.equal(brks[1].TradingSymbol);
  });
});
