import { fail } from 'assert';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FinTenDB from '../../../../src/classes/db/FinTenDB';
import PaymentModel, { Payment } from '../../../../src/classes/db/models/Payment';
import { User, UserDocument } from '../../../../src/classes/db/models/User';

chai.use(chaiAsPromised);

const user: User = {
  username: 'testuser',
  password: 'testpassword',
  email: 'email@internet.com'
};

let newUser: UserDocument;
describe('Payment model tests', () => {
  let mongod: MongoMemoryServer, uri: string;

  before('before: loading memory DB', async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      const db = await FinTenDB.getInstance().connect(uri);
      newUser = await db.createUser(user);
    } catch (ex) {
      throw ex;
    }
  });

  after('after: stopping DBs', async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  it('should create a new payment', async () => {
    try {
      const payment: Payment = {
        user: newUser._id,
        date: new Date(),
        amount: 200
      };
      const newPayment = await new PaymentModel(payment).save();

      expect(newPayment.user).to.equal(newUser._id);
      expect(newPayment.date).to.equal(payment.date);
      expect(newPayment.amount).to.equal(payment.amount);
    } catch (ex) {
      fail(ex);
    }
  });

  it('should populate the user path', async () => {
    try {
      const payment: Payment = {
        user: newUser._id,
        date: new Date(),
        amount: 200
      };
      const newPayment = await new PaymentModel(payment).save();
      newUser.payments.push(newPayment._id);
      await newUser.save();
      const populatedPayment = await PaymentModel.findWithUser(newPayment._id);
      const populatedUser = await newUser.populate('payments').execPopulate();

      expect(populatedPayment.user._id.equals(populatedUser._id.toString())).to.be.true;
      expect(populatedPayment._id.equals(populatedUser.payments[0]._id)).to.be.true;
    } catch (ex) {
      fail(ex);
    }
  });
});
