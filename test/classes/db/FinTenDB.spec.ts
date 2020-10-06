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
  // before(done => {
  //   mongo
  //     .getUri()
  //     .then(uri => {
  //       console.log(`URI is ${uri}`);
  //       return mongoose.connect(uri, options);
  //     })
  //     .then(() => {
  //       done();
  //     });
  // });
  // it('should count 0 filings', done => {
  //   const db = FinTenDB.getInstance()
  //     .then(db => {
  //       db.use(mongoose);
  //       return FilingSchema.count({});
  //     })
  //     .then(count => {
  //       count; //?
  //       expect(count).to.equal(0);
  //       done();
  //     });
  // });
  // after(() => {
  //   console.log('Closing connections!');
  // });
});
