import { fail } from 'assert';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import moment from 'moment';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../../src/classes/db/FinTenDB';
import PaymentModel, { PaymentDocument } from '../../../../src/classes/db/models/Payment';
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
    return await UserModel.ensureIndexes();
  });

  afterEach(async () => {
    return await UserModel.collection.drop();
  });

  it('should create a new user with the default settings', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };
    try {
      await FinTenDB.getInstance().connect(uri);
      const newUser = await new UserModel(user).save();
      const m = moment.utc().toDate();

      expect(newUser.isAdmin).to.be.false;
      expect(newUser.isPremium).to.be.false;
      expect(newUser.isPremiumUntil).to.be.null;
      expect(newUser.payments).to.be.empty;
      expect(newUser.changePasswordRequest).to.be.null;
      expect(newUser.nonce).to.be.null;
      expect(newUser.username).to.equal(user.username);
      expect(newUser.email).to.equal(user.email);
      expect(newUser.password).to.not.equal(user.password);
      expect(await newUser.checkPassword(user.password)).to.be.true;

      expect(newUser.registrationDate.getFullYear()).to.equal(m.getFullYear());
      expect(newUser.registrationDate.getMonth()).to.equal(m.getMonth());
      expect(newUser.registrationDate.getDay()).to.equal(m.getDay());
      expect(newUser.registrationDate.getHours()).to.equal(m.getHours());
      expect(newUser.registrationDate.getMinutes()).to.equal(m.getMinutes());

      expect(await UserModel.countDocuments().exec()).to.equal(1);
    } catch (ex) {
      fail(ex);
    }
  });

  it('should indicate wrong password', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email'
    };
    const newUser = new UserModel(user);
    expect(await newUser.checkPassword(user.password + '0')).to.be.false;
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
      newUserRepeatedUsername.save().should.be.rejectedWith(/dup key: { : "testuser" }/),
      newUserRepeatedEmail.save().should.be.rejectedWith(/dup key: { : "email@internet.com" }/)
    ]);
  });

  it('should be premium using isPremiumUntil', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };
    const testuser = await new UserModel(user).save();
    testuser.isPremiumUntil = moment().add(1, 'days').toDate();
    await testuser.save();

    const reloadedTestUser = await UserModel.findById(testuser._id);
    if (reloadedTestUser === null) throw new Error('Cannot find user!');
    expect(reloadedTestUser.username).to.equal('testuser');
    expect(reloadedTestUser.isPremium).to.be.true;
  });

  it('should consider admins premium users', async () => {
    const user: User = {
      username: 'adminuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };
    const testuser = await new UserModel(user).save();
    testuser.isAdmin = true;
    await testuser.save();

    const admin = await UserModel.findOne({ username: 'adminuser' });

    if (admin === null) {
      fail('Admin user was not found!');
    }
    expect(admin.isPremium).to.be.true;
  });

  it('should get the id of the last payment and it should equal the id of the payment added last', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };

    const testuser = await new UserModel(user).save();

    const firstPayment: PaymentDocument = await PaymentModel.create({
      user: testuser._id,
      date: moment.utc().toDate(),
      amount: 100
    });
    const secondPayment: PaymentDocument = await PaymentModel.create({
      user: testuser._id,
      date: moment.utc().toDate(),
      amount: 200
    });
    testuser.payments.push(firstPayment, secondPayment);
    await testuser.save();

    const retrievedTestUser = await UserModel.findOne({ username: 'testuser' });
    if (retrievedTestUser === null) {
      fail('User could not be retrieved from mongodb-memory-server');
    }

    expect(retrievedTestUser.lastPayment.equals(firstPayment._id)).to.be.false;
    expect(retrievedTestUser.lastPayment.equals(secondPayment._id)).to.be.true;
  });

  it('should populate the array of payments', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };

    const testuser = await new UserModel(user).save();

    const firstPayment: PaymentDocument = await PaymentModel.create({
      user: testuser._id,
      date: moment.utc().toDate(),
      amount: 100
    });
    const secondPayment: PaymentDocument = await PaymentModel.create({
      user: testuser._id,
      date: moment.utc().toDate(),
      amount: 200
    });
    testuser.payments.push(firstPayment, secondPayment);
    await testuser.save();

    const retrievedTestUser = await UserModel.findWithPayments(testuser._id);
    if (retrievedTestUser === null) {
      fail('User could not be retrieved from mongodb-memory-server');
    }

    expect(retrievedTestUser.payments.length).to.equal(2);

    expect(retrievedTestUser.payments[0].equals(firstPayment)).to.be.true;
    expect(retrievedTestUser.payments[0].equals(secondPayment)).to.be.false;

    expect(retrievedTestUser.payments[1].equals(firstPayment)).to.be.false;
    expect(retrievedTestUser.payments[1].equals(secondPayment)).to.be.true;

    expect(retrievedTestUser.lastPayment.equals(secondPayment)).to.be.true;
  });

  it('the last payment from a populated UserDocument should equal the PaymentDocument that was added last', async () => {
    const user: User = {
      username: 'testuser',
      password: 'testpassword',
      email: 'email@internet.com'
    };

    const testuser = await new UserModel(user).save();

    const firstPayment: PaymentDocument = await PaymentModel.create({
      user: testuser._id,
      date: moment.utc().toDate(),
      amount: 200
    });
    const secondPayment: PaymentDocument = await PaymentModel.create({
      user: testuser._id,
      date: moment.utc().toDate(),
      amount: 200
    });
    testuser.payments.push(firstPayment, secondPayment);
    await testuser.save();

    const retrievedTestUser = await UserModel.findWithPayments(testuser._id);
    if (retrievedTestUser === null) {
      fail('User could not be retrieved from mongodb-memory-server');
    }

    expect(retrievedTestUser.lastPayment.equals(secondPayment)).to.be.true;
  });
});
