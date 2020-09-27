import { expect } from 'chai';
import path from 'path';
import XBRL from '../../../src/classes/secgov/XBRL';

describe('XBRL tests', () => {
  // fromTxt
  //extractXmlsFromTxt
  //extractXmlFromTxt
  it('should extract xml', () => {
    const xml = XBRL.extractXmlFromTxt(
      path.join(__dirname, '1stXBRLvalid.txt')
    );

    expect(xml.xml).to.not.be.undefined;
    expect(xml.xml.length).to.be.greaterThan(0);
  });
});
