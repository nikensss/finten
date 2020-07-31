import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import request from 'supertest';
import app from '../../../src/main';

const should = chai.should();

chai.use(chaiHttp);

describe('/GET', () => {
  const agent = request.agent(app);

  it('should get root', () => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('greeting');
        expect(res.body.greeting).to.be.equal('You reached the FinTen API! 🥳');
      })
  });
});