import { expect } from 'chai';
import { SecGovTextParser } from '../../../src/classes/secgov/SecGovTextParser';

describe('SecGov Text file Parser tests', function () {
  this.slow(2000);

  it('should parse 6 files', async () => {
    const paths = [
      'test/classes/secgov/samples/0000320193-19-000119.txt',
      'test/classes/secgov/samples/0001564590-19-037549.txt',
      'test/classes/secgov/samples/0001564590-19-038256.txt',
      'test/classes/secgov/samples/0000320193-20-000062.txt',
      'test/classes/secgov/samples/0001564590-20-034944.txt',
      'test/classes/secgov/samples/0001564590-20-033670.txt'
    ];

    for await (const p of paths) {
      const parser = new SecGovTextParser(p);
      const xmls: string[] = [];

      while (await parser.hasNext()) {
        xmls.push(await parser.next());
      }

      expect(xmls.length).to.equal(6);
    }
  });

  it('should parse 0 files', async () => {
    const path = 'test/classes/secgov/samples/NoXBRLs.txt';

    const parser = new SecGovTextParser(path);
    const xmls: string[] = [];

    while (await parser.hasNext()) {
      xmls.push(await parser.next());
    }

    expect(xmls.length).to.equal(0);
  });
});
