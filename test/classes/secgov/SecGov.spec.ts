import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import SecGov from '../../../src/classes/secgov/SecGov';
import DownloadManager from '../../../src/classes/download/DownloadManager';
import Downloader from '../../../src/classes/download/Downloader.interface';
import TimedQueue from '../../../src/classes/download/queues/TimedQueue';
import Downloadable from '../../../src/classes/download/Downloadable.interface';
import { Quarter } from '../../../src/classes/xbrl/XBRL';
import FormType from '../../../src/classes/filings/FormType.enum';
import FilingMetadata from '../../../src/classes/filings/FilingMetadata';

chai.use(chaiAsPromised);

describe('SecGov tests', function () {
  this.slow(300);
  it('should create a SecGov', () => {
    const secgov = new SecGov(new DownloadManager());
    expect(secgov).to.not.be.undefined;
  });

  it('should set TimedQueue for Downloader', () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);

    when(mockedDownloader.use(anything())).thenCall((q: unknown) => {
      expect(q instanceof TimedQueue).to.be.true;
      expect((q as TimedQueue<Downloadable>).getTimer().getTimeout()).to.equal(100);
    });
    new SecGov(downloader);
  });

  it('should throw error start > end', () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);

    expect(new SecGov(downloader).getIndices(2015, 2014)).to.be.rejectedWith('start > end 🤯');
  });

  it('should call "get" 16 times', () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);

    when(mockedDownloader.get(anything())).thenResolve({
      url: 'mock',
      fileName: 'mockFileName.idx'
    });

    new SecGov(downloader).getIndices(2015, 2018).then(() => {
      verify(mockedDownloader.get(anything())).times(16);
    });
  });

  it('should call get index with the proper url', () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);
    const expectedURL = 'https://www.sec.gov/Archives/edgar/full-index//2018/QTR1/xbrl.idx';
    const expectedFileName = '2018_QTR1_xbrl.idx';

    when(mockedDownloader.get(anything())).thenCall((...d: Downloadable[]) => {
      expect(d.length).to.equal(1);
      expect(d[0].url).to.equal(expectedURL);
      expect(d[0].fileName).to.equal(expectedFileName);
    });

    new SecGov(downloader).getIndex(2018, Quarter.QTR1);
    verify(mockedDownloader.get(anything())).once();
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

    const filingsMetadata = new SecGov(new DownloadManager()).parseIndices(indicesToParse, [
      FormType.F10K,
      FormType.F10Q
    ]);

    expect(filingsMetadata.length).to.equal(5449 * indicesToParse.length);
    expect(filingsMetadata.every((f) => f instanceof FilingMetadata)).to.be.true;
  });

  it('should parse one idx file', () => {
    const filingsMetadata = new SecGov(new DownloadManager()).parseIndex(
      path.join(__dirname, 'xbrl.idx'),
      [FormType.F10K, FormType.F10Q]
    );
    expect(filingsMetadata.length).to.equal(5449);
    expect(filingsMetadata.every((f) => f instanceof FilingMetadata)).to.be.true;
  });

  it('should get EntityCentralIndexKey map', () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);
    const expectedUrl = 'https://www.sec.gov/include/ticker.txt';
    const expectedFileName = 'ticker_ecik_map.txt';

    when(mockedDownloader.get(anything())).thenCall((...d: Downloadable[]) => {
      expect(d.length).to.be.equal(1);
      expect(d[0].url).to.equal(expectedUrl);
      expect(d[0].fileName).to.equal(expectedFileName);
    });

    new SecGov(downloader).getEntityCentralIndexKeyMap();
    verify(mockedDownloader.get(anything())).once();
  });

  it('should get filings through the Downloader', async () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);
    const secgov = new SecGov(downloader);
    const filings = secgov.parseIndex(path.join(__dirname, 'xbrl.idx'), [
      FormType.F10K,
      FormType.F10Q
    ]);

    await secgov.getFilings(...filings);
    verify(mockedDownloader.get(anything())).atLeast(filings.length);
  });

  it('should find the proper SecGov url when downloading', async () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);
    when(mockedDownloader.get(anything())).thenCall((d: Downloadable) => {
      expect(d.url.startsWith('https://www.sec.gov/Archives/')).to.be.true;
      expect(d.url.startsWith(SecGov.FILINGS_ROOT)).to.be.true;
    });

    const secgov = new SecGov(downloader);
    const filings = secgov.parseIndex(path.join(__dirname, 'xbrl.idx'), [
      FormType.F10K,
      FormType.F10Q
    ]);

    await secgov.getFilings(...filings);
  });

  it('should delegate flush to dm', () => {
    const mockedDownloader: Downloader<Downloadable> = mock<Downloader<Downloadable>>();
    const downloader: Downloader<Downloadable> = instance(mockedDownloader);
    new SecGov(downloader).flush();
    verify(mockedDownloader.flush()).once();
  });
});
