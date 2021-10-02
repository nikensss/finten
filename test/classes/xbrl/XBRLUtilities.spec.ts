import { fail } from 'assert';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import CompanyInfoModel from '../../../src/classes/db/models/CompanyInfo';
import XBRL from '../../../src/classes/xbrl/XBRL';
import XBRLUtilities from '../../../src/classes/xbrl/XBRLUtilities';

chai.use(chaiAsPromised);

describe('XBRL tests', function () {
  this.slow(200);

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
    let isStopped = false;
    while (!isStopped) {
      isStopped = await mongod.stop();
    }
  });

  beforeEach(async () => {
    await CompanyInfoModel.ensureIndexes();
  });

  afterEach(async () => {
    if ((await CompanyInfoModel.countDocuments().exec()) > 0) {
      await CompanyInfoModel.collection.drop();
    }
  });

  it('should return one document', async () => {
    const firstValid = await XBRLUtilities.fromFile(path.join(__dirname, '1stXbrlValid.txt'));
    const thirdValid = await XBRLUtilities.fromFile(path.join(__dirname, '3rdXbrlValid.txt'));

    expect(firstValid instanceof XBRL).to.be.true;
    expect(thirdValid.constructor.name).to.equal('XBRL');
  });

  it('should reject with "No XBRL found"', () => {
    return expect(XBRLUtilities.fromFile(path.join(__dirname, 'NoXBRLs.txt'))).to.be.rejectedWith(
      'No XBRL found'
    );
  });

  it('should not add the TradingSymbol if not found and not available', async () => {
    try {
      const xbrl = await XBRLUtilities.fromFile(path.join(__dirname, 'xbrl-no-trading-symbol.txt'));
      expect(xbrl.hasTradingSymbol()).to.be.false;
    } catch (ex) {
      fail(`An exception was caught: ${ex.message}`);
    }
  });

  it('should add the TradingSymbol if not found', async () => {
    const companyInfo = {
      EntityCentralIndexKey: 1011060,
      StandardIndustrialClassification: 3841,
      EntityRegistrantName: 'EKIMAS Corp',
      StateCountry: 'MA',
      Office: 'Office of Life Sciences',
      IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
      TradingSymbol: 'ASNB'
    };
    try {
      await FinTenDB.getInstance().connect(uri);
      await new CompanyInfoModel(companyInfo).save();
      const xbrl = await XBRLUtilities.fromFile(path.join(__dirname, 'xbrl-no-trading-symbol.txt'));
      expect(xbrl.hasTradingSymbol()).to.be.true;
      expect(xbrl.get().TradingSymbol).to.equal(companyInfo.TradingSymbol);
    } catch (ex) {
      fail(`An exception was caught: ${ex.message}`);
    }
  });

  it('should add all TradingSymbols if not found', async () => {
    const companyInfos = [
      {
        EntityCentralIndexKey: 1011060,
        StandardIndustrialClassification: 3841,
        EntityRegistrantName: 'EKIMAS Corp',
        StateCountry: 'MA',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
        TradingSymbol: 'ASNB'
      },
      {
        EntityCentralIndexKey: 1011060,
        StandardIndustrialClassification: 3841,
        EntityRegistrantName: 'EKIMAS Corp',
        StateCountry: 'MA',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
        TradingSymbol: 'ASNA'
      },
      {
        EntityCentralIndexKey: 1011060,
        StandardIndustrialClassification: 3841,
        EntityRegistrantName: 'EKIMAS Corp',
        StateCountry: 'MA',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
        TradingSymbol: 'ASNO'
      }
    ];
    try {
      await FinTenDB.getInstance().connect(uri);
      for (const companyInfo of companyInfos) {
        await new CompanyInfoModel(companyInfo).save();
      }
      const xbrl = await XBRLUtilities.fromFile(path.join(__dirname, 'xbrl-no-trading-symbol.txt'));
      expect(xbrl.hasTradingSymbol()).to.be.true;
      expect(xbrl.get().TradingSymbol).to.equal('ASNA;ASNB;ASNO');
    } catch (ex) {
      fail(`An exception was caught: ${ex.message}`);
    }
  });

  it('should add all TradingSymbols even if found', async () => {
    const companyInfos = [
      {
        EntityCentralIndexKey: 1011060,
        StandardIndustrialClassification: 3841,
        EntityRegistrantName: 'EKIMAS Corp',
        StateCountry: 'MA',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
        TradingSymbol: 'ASNB'
      },
      {
        EntityCentralIndexKey: 1011060,
        StandardIndustrialClassification: 3841,
        EntityRegistrantName: 'EKIMAS Corp',
        StateCountry: 'MA',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
        TradingSymbol: 'ASNA'
      },
      {
        EntityCentralIndexKey: 1011060,
        StandardIndustrialClassification: 3841,
        EntityRegistrantName: 'EKIMAS Corp',
        StateCountry: 'MA',
        Office: 'Office of Life Sciences',
        IndustryTitle: 'SURGICAL & MEDICAL INSTRUMENTS & APPARATUS',
        TradingSymbol: 'ASNO'
      }
    ];
    try {
      await FinTenDB.getInstance().connect(uri);
      for (const companyInfo of companyInfos) {
        await new CompanyInfoModel(companyInfo).save();
      }
      const xbrl = await XBRLUtilities.fromFile(
        path.join(__dirname, 'xbrl-one-trading-symbol.txt')
      );
      expect(xbrl.hasTradingSymbol()).to.be.true;
      expect(xbrl.get().TradingSymbol).to.equal('ASNA;ASNB;ASNO');
    } catch (ex) {
      fail(`An exception was caught: ${ex.message}`);
    }
  });
});
