import { fail } from 'assert';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../../src/classes/db/FinTenDB';
import UserModel, { User } from '../../../../src/classes/db/models/User';

chai.should();
chai.use(chaiAsPromised);

describe('User model tests', function () {
  this.slow(500);
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading memory DB', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      await FinTenDB.getInstance().connect(uri);
      await UserModel.ensureIndexes();
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await UserModel.ensureIndexes();
  });

  afterEach(async () => {
    await UserModel.collection.drop();
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

  it('should fail with duplicate keys', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };
    const userRepeatedUsername: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email2@internet.com'
    };
    const userRepeatedEmail: User = {
      username: 'testuser2',
      password: 'testpassword',
      email: 'email@internet.com'
    };
    await new UserModel(user).save();
    const newUserRepeatedUsername = new UserModel(userRepeatedUsername);
    const newUserRepeatedEmail = new UserModel(userRepeatedEmail);

    return Promise.all([
      newUserRepeatedUsername.save().should.be.rejectedWith('duplicate key'),
      newUserRepeatedEmail.save().should.be.rejectedWith('duplicate key')
    ]);
  });
});
