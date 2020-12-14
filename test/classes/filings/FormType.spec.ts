import FormType, { byName } from '../../../src/classes/filings/FormType.enum';
import { expect } from 'chai';

describe('FormType tests', () => {
  it('should create a FormFiling from a string', () => {
    const f10k = byName('10-K');
    expect(f10k).to.be.equal(FormType.F10K);

    const f10ka = byName('10-K/A');
    expect(f10ka).to.be.equal(FormType.F10KA);

    const f10kt = byName('10-KT');
    expect(f10kt).to.be.equal(FormType.F10KT);

    const f8k = byName('8-K');
    expect(f8k).to.be.equal(FormType.F8K);
  });

  it('should fail with unknown type', () => {
    expect(() => byName('not a filing')).to.throw('Unknown filing type: not a filing');
  });
});
