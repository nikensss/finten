import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import XBRLUtilities from '../../../src/classes/xbrl/XBRLUtilities';

chai.use(chaiAsPromised);

describe('XBRL tests', function () {
  this.slow(200);
  //extractXmlFromFile
  it('should extract xml', () => {
    const xml = XBRLUtilities.extractXMLFromFile(path.join(__dirname, '1stXbrlValid.txt'));

    expect(xml.xml).to.not.be.undefined;
    expect(xml.xml.length).to.be.greaterThan(0);
  });

  it('should not extract xml', () => {
    expect(() => {
      XBRLUtilities.extractXMLFromFile(path.join(__dirname, 'NoXBRLS.txt'));
    }).to.throw('No XBRL found!');
  });

  it('should not extract several xmls', () => {
    expect(() => {
      XBRLUtilities.extractXMLsFromFile(path.join(__dirname, 'NoXBRLS.txt'));
    }).to.throw('No XBRL found!');
  });

  //extractXMLsFromFile
  it('should extract several xmls', () => {
    const xmls = XBRLUtilities.extractXMLsFromFile(path.join(__dirname, '3rdXbrlValid.txt'));

    expect(xmls.length).to.be.greaterThan(1);
  });

  // fromFile
  it('should return one document', (done) => {
    XBRLUtilities.fromFile(path.join(__dirname, '1stXbrlValid.txt')).then((d) => {
      expect(d).to.not.be.undefined;
      done();
    });
  });

  it('should return one document again', (done) => {
    XBRLUtilities.fromFile(path.join(__dirname, '3rdXbrlValid.txt')).then((d) => {
      expect(d).to.not.be.undefined;
      done();
    });
  });

  it('should reject with "No XBRL found"', () => {
    expect(XBRLUtilities.fromFile(path.join(__dirname, 'NoXBRLS.txt'))).to.be.rejectedWith(
      'No XBRL found'
    );
  });
});
