import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../src/classes/db/FinTenDB';
import FilingSchema from '../../../src/classes/db/models/Filing';

const mongo = new MongoMemoryServer();

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

describe('FinTenDB tests', () => {
  before(async () => {
    const uri = await mongo.getUri();
    console.log(`URI is ${uri}`);
    return mongoose.connect(uri, options);
  });

  it('should count 0 filings', async done => {
    const db = await FinTenDB.getInstance();
    db.use(mongoose);
    const count = await FilingSchema.count({});
    expect(count).to.equal(0);
  });

  after(() => {
    console.log('Closing connections!');
  });
});
