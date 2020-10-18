import { fail } from 'assert';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../../src/classes/db/FinTenDB';
import UserModel, { User } from '../../../../src/classes/db/models/User';

chai.should();
chai.use(chaiAsPromised);

describe('User model tests', () => {
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading memory DB', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      await FinTenDB.getInstance().connect(uri);
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  it('should create default user', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };
    try {
      const db = await FinTenDB.getInstance().connect(uri);
      const newUser = await db.createUser(user);

      expect(newUser.isAdmin).to.be.false;
      expect(newUser.isPremiumUntil).to.be.null;
      expect(newUser.payments).to.be.empty;
      expect(newUser.changePasswordRequest).to.be.null;
      expect(newUser.nonce).to.be.null;
      expect(newUser.username).to.equal(user.username);
      expect(newUser.email).to.equal(user.email);
      expect(await newUser.checkPassword(user.password)).to.be.true;
      expect(await newUser.checkPassword(user.password + 'asdf')).to.be.false;
      expect(newUser.registrationDate).to.be.lessThan(new Date());

      UserModel.countDocuments({}, (err, count) => {
        expect(count).to.be.equal(1);
      });
    } catch (ex) {
      fail(ex);
    }
  });

  it('should not pass email validation', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email'
    };
    const newUser = new UserModel(user);
    return newUser.validate().should.be.rejectedWith('validation failed: email');
  });

  // it('should retrieve all filings', async () => {
  //   try {
  //     const EXPECTED_TOTAL = 40;
  //     let total = 0;
  //     const db = await FinTenDB.getInstance().connect(uri);

  //     await db.findFilings({}).eachAsync(() => {
  //       total += 1;
  //     });

  //     expect(total).to.be.equal(EXPECTED_TOTAL);
  //   } catch (ex) {
  //     fail(ex);
  //   }
  // });

  // it('should update tickers', async () => {
  //   try {
  //     const db = await FinTenDB.getInstance().connect(uri);

  //     await db.findFilings({}).eachAsync((filing: FilingDocument) => {
  //       filing.TradingSymbol = 'FOO';
  //       return filing.save();
  //     });

  //     await db.findFilings({}).eachAsync((filing: FilingDocument) => {
  //       expect(filing.TradingSymbol).to.be.equal('FOO');
  //     });
  //   } catch (ex) {
  //     fail(ex);
  //   }
  // });
});
