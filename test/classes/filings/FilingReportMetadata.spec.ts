import FilingReportMetadata from '../../../src/classes/filings/FilingReportMetadata';
import { expect } from 'chai';

describe('FilingReportMetadata tests', () => {
  it('should construct FilingReportMetadata object', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    expect(filingReportMetadata).to.not.be.undefined;
  });

  it('should get cik', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    const cik = filingReportMetadata.cik;
    expect(cik).to.be.equal(98677);
  });

  it('should get companyName', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    const companyName = filingReportMetadata.companyName;
    expect(companyName).to.be.equal('TOOTSIE ROLL INDUSTRIES INC');
  });

  it('should get formType', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    const formType = filingReportMetadata.formType;
    expect(formType).to.be.equal('10-K');
  });

  it('should get submissionDate', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    const submissionDate = filingReportMetadata.submissionDate;
    expect(submissionDate).to.deep.equal(new Date('2020-05-08'));
  });

  it('should get partialPath', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    const partialPath = filingReportMetadata.partialPath;
    expect(partialPath).to.be.equal(
      'edgar/data/98677/0001558370-20-005994.txt'
    );
  });

  it('should get fullPath', () => {
    const filingReportMetadata = new FilingReportMetadata(
      '98677|TOOTSIE ROLL INDUSTRIES INC|10-K|2020-05-08|edgar/data/98677/0001558370-20-005994.txt'
    );

    const fullPath = filingReportMetadata.fullPath;
    expect(fullPath).to.be.equal(
      'https://www.sec.gov/Archives/edgar/data/98677/0001558370-20-005994.txt'
    );
  });
});
