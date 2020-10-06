import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import XBRLUtilities from '../../../src/classes/secgov/XBRLUtilities';

const should = chai.use(chaiAsPromised).should();

describe('XBRL tests', () => {
  //extractXmlFromTxt
  it('should extract xml', () => {
    const xml = XBRLUtilities.extractXmlFromTxt(
      path.join(__dirname, '1stXBRLvalid.txt')
    );

    expect(xml.xml).to.not.be.undefined;
    expect(xml.xml.length).to.be.greaterThan(0);
  });

  it('should not extract xml', () => {
    expect(() => {
      XBRLUtilities.extractXmlFromTxt(path.join(__dirname, 'NoXBRLS.txt'));
    }).to.throw('No XBRL found!');
  });

  it('should not extract several xmls', () => {
    expect(() => {
      XBRLUtilities.extractXmlsFromTxt(path.join(__dirname, 'NoXBRLS.txt'));
    }).to.throw('No XBRL found!');
  });

  //extractXmlsFromTxt
  it('should extract several xmls', () => {
    const xmls = XBRLUtilities.extractXmlsFromTxt(
      path.join(__dirname, '3rdXBRLvalid.txt')
    );

    expect(xmls.length).to.be.greaterThan(1);
  });

  // fromTxt
  it('should return one document', done => {
    XBRLUtilities.fromTxt(path.join(__dirname, '1stXBRLvalid.txt')).then(d => {
      expect(d).to.not.be.undefined;
      done();
    });
  });

  it('should return one document again', done => {
    XBRLUtilities.fromTxt(path.join(__dirname, '3rdXBRLvalid.txt')).then(d => {
      expect(d).to.not.be.undefined;
      done();
    });
  });

  it('should throw error', done => {
    XBRLUtilities.fromTxt(path.join(__dirname, 'NoXBRLS.txt'))
      .then(d => {
        done(new Error('Should not be here...'));
      })
      .catch(ex => {
        done();
      });
  });
});
