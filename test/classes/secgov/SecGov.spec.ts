import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import mocker from 'ts-mockito';
import SecGov from '../../../src/classes/secgov/SecGov';
import DownloadManager from '../../../src/classes/download/DownloadManager';
import Downloader from '../../../src/classes/download/Downloader';
import TimedQueue from '../../../src/classes/download/queues/TimedQueue';
import Downloadable from '../../../src/classes/download/Downloadable';
import { Quarter } from '../../../src/classes/secgov/XBRL';
import FormType from '../../../src/classes/filings/FormType';
import FilingMetadata from '../../../src/classes/filings/FilingMetadata';

chai.use(chaiAsPromised);

describe('SecGov tests', () => {
  it('should create a SecGov', () => {
    const secgov = new SecGov(new DownloadManager());
    expect(secgov).to.not.be.undefined;
  });

  it('should not accept null or undefined in the constructor', () => {
    expect(() => new SecGov(null)).to.throw(
      'Please, provide a valid Downloader'
    );
    expect(() => new SecGov(undefined)).to.throw(
      'Please, provide a valid Downloader'
    );
  });

  it('should set TimedQueue for Downloader', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);

    mocker
      .when(mockedDownloader.use(mocker.anything()))
      .thenCall((q: unknown) => {
        expect(q instanceof TimedQueue).to.be.true;
        expect((q as TimedQueue).getTimer().getTimeout()).to.equal(100);
      });
    new SecGov(downloader);
  });

  it('should throw error start > end', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);

    expect(new SecGov(downloader).getIndices(2015, 2014)).to.be.rejectedWith(
      'start > end 🤯'
    );
  });

  it('should call "get" 4 times', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);

    mocker
      .when(mockedDownloader.get(mocker.anything()))
      .thenResolve([{ url: 'mock', fileName: 'mockFileName.idx' }]);

    new SecGov(downloader).getIndices(2015, 2018).then(() => {
      mocker.verify(mockedDownloader.get(mocker.anything())).times(16);
    });
  });

  it('should call get index with the proper url', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);
    const expectedURL =
      'https://www.sec.gov/Archives/edgar/full-index//2018/QTR1/xbrl.idx';
    const expectedFileName = '2018_QTR1_xbrl.idx';

    mocker
      .when(mockedDownloader.get(mocker.anything()))
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.be.greaterThan(0);
        expect(d[0].url).to.equal(expectedURL);
        expect(d[0].fileName).to.equal(expectedFileName);
      });

    new SecGov(downloader).getIndex(2018, Quarter.QTR1);
    mocker.verify(mockedDownloader.get(mocker.anything())).once();
  });

  it('should parse several idx files', () => {
    const indicesToParse = [
      {
        url: '',
        fileName: path.join(__dirname, 'xbrl.idx')
      },
      {
        url: '',
        fileName: path.join(__dirname, 'xbrl.idx')
      },
      {
        url: '',
        fileName: path.join(__dirname, 'xbrl.idx')
      }
    ];

    const filingsMetadata = new SecGov(
      new DownloadManager()
    ).parseIndices(indicesToParse, [FormType.F10K, FormType.F10Q]);

    expect(filingsMetadata.length).to.equal(5449 * indicesToParse.length);
    expect(filingsMetadata.every((f) => f instanceof FilingMetadata)).to.be
      .true;
  });

  it('should parse an idx file', () => {
    const filingsMetadata = new SecGov(
      new DownloadManager()
    ).parseIndex(path.join(__dirname, 'xbrl.idx'), [
      FormType.F10K,
      FormType.F10Q
    ]);
    expect(filingsMetadata.length).to.equal(5449);
    expect(filingsMetadata.every((f) => f instanceof FilingMetadata)).to.be
      .true;
  });

  it('should get EntityCentralIndexKey map', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);
    const expectedUrl = 'https://www.sec.gov/include/ticker.txt';
    const expectedFileName = 'ticker_ecik_map.txt';

    mocker
      .when(mockedDownloader.get(mocker.anything()))
      .thenCall((...d: Downloadable[]) => {
        expect(d.length).to.be.equal(1);
        expect(d[0].url).to.equal(expectedUrl);
        expect(d[0].fileName).to.equal(expectedFileName);
      });

    new SecGov(downloader).getEntityCentralIndexKeyMap();
    mocker.verify(mockedDownloader.get(mocker.anything())).once();
  });

  it('should get filings through the Downloader', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);
    new SecGov(downloader).getFilings();
    mocker.verify(mockedDownloader.get()).once();
  });

  it('should delegate flush to dm', () => {
    const mockedDownloader: Downloader = mocker.mock<Downloader>();
    const downloader: Downloader = mocker.instance(mockedDownloader);
    new SecGov(downloader).flush();
    mocker.verify(mockedDownloader.flush()).once();
  });
});
