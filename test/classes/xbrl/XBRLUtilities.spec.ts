import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import XBRLUtilities from '../../../src/classes/xbrl/XBRLUtilities';

chai.use(chaiAsPromised);

describe('XBRL tests', function () {
  this.slow(200);

  it('should return one document', async () => {
    const firstValid = await XBRLUtilities.fromFile(path.join(__dirname, '1stXbrlValid.txt'));
    const thirdValid = await XBRLUtilities.fromFile(path.join(__dirname, '3rdXbrlValid.txt'));

    expect(firstValid.constructor.name).to.equal('XBRL');
    expect(thirdValid.constructor.name).to.equal('XBRL');
  });

  it('should reject with "No XBRL found"', () => {
    return expect(XBRLUtilities.fromFile(path.join(__dirname, 'NoXBRLs.txt'))).to.be.rejectedWith(
      'No XBRL found'
    );
  });
});
