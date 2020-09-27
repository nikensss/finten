import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import XBRL from '../../../src/classes/secgov/XBRL';

const should = chai.use(chaiAsPromised).should();

describe('XBRL tests', () => {
  //extractXmlFromTxt
  it('should extract xml', () => {
    const xml = XBRL.extractXmlFromTxt(
      path.join(__dirname, '1stXBRLvalid.txt')
    );

    expect(xml.xml).to.not.be.undefined;
    expect(xml.xml.length).to.be.greaterThan(0);
  });

  it('should not extract xml', () => {
    expect(() => {
      XBRL.extractXmlFromTxt(path.join(__dirname, 'NoXBRLS.txt'));
    }).to.throw('No XBRL found!');
  });

  //extractXmlsFromTxt
  it('should extract several xmls', () => {
    const xmls = XBRL.extractXmlsFromTxt(
      path.join(__dirname, '3rdXBRLvalid.txt')
    );

    expect(xmls.length).to.be.greaterThan(1);
  });

  // fromTxt
  it('should return one document', done => {
    const xbrl = XBRL.fromTxt(path.join(__dirname, '1stXBRLvalid.txt'));
    xbrl.then(d => {
      expect(d).to.not.be.undefined;
      done();
    });
  });

  it('should return one document again', done => {
    const xbrl = XBRL.fromTxt(path.join(__dirname, '3rdXBRLvalid.txt'));
    xbrl.then(d => {
      expect(d).to.not.be.undefined;
      done();
    });
  });

  it('should throw error', done => {
    const xbrl = XBRL.fromTxt(path.join(__dirname, 'NoXBRLS.txt'));
    xbrl
      .then(d => {
        done(new Error('Should not be here...'));
      })
      .catch(ex => {
        done();
      });
  });
});
