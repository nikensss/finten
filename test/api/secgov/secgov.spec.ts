import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../../src/main';
import UserModel from '../../../src/classes/db/models/User';
import FinTenDB from '../../../src/classes/db/FinTenDB';

chai.should();
chai.use(chaiHttp);

let mongod: MongoMemoryServer, uri: string;

describe('API SecGov routes', function () {
  this.timeout(5000);

  before(async () => {
    mongod = new MongoMemoryServer();
    try {
      uri = await mongod.getUri();
      if (!FinTenDB.getInstance().isConnected()) {
        await FinTenDB.getInstance().disconnect();
        await FinTenDB.getInstance().connect(uri);
      }
      await UserModel.ensureIndexes();
      const newUser = await new UserModel({
        username: 'adminuser',
        password: 'adminuser',
        email: 'email@inter.net'
      }).save();

      newUser.isAdmin = true;
      await newUser.save();
      request.agent(app);
    } catch (ex) {
      throw ex;
    }
  });

  after(async () => {
    await FinTenDB.getInstance().disconnect();
    await mongod.stop();
  });

  it('should get root', () => {
    chai
      .request(app)
      .get('/')
      .set('Connection', 'close')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('greeting');
        expect(res.body.greeting).to.be.equal('You reached the FinTen API! 🥳');
      });
  });

  it('should fail with 401 Unauthorized because no token is given', () => {
    chai
      .request(app)
      .get('/secgov/fill')
      .set('Connection', 'close')
      .end((err, res) => {
        res.should.have.status(401);
      });
  });
});
