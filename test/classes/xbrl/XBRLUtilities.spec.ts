import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import XBRLUtilities from '../../../src/classes/xbrl/XBRLUtilities';

import CompanyInfoModel from '../../../src/classes/db/models/CompanyInfo';
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

  it('should return one document', async () => {
    const firstValid = await XBRLUtilities.fromFile(path.join(__dirname, '1stXbrlValid.txt'));
    const thirdValid = await XBRLUtilities.fromFile(path.join(__dirname, '3rdXbrlValid.txt'));

    expect(firstValid.constructor.name).to.equal('XBRL');
    expect(thirdValid.constructor.name).to.equal('XBRL');
  });

  it('should reject with "No XBRL found"', () => {
    return expect(XBRLUtilities.fromFile(path.join(__dirname, 'NoXBRLs.txt'))).to.be.rejectedWith(
      'No XBRL found'
    );
  });

  it.skip('should add the TradingSymbol if not found');
});
