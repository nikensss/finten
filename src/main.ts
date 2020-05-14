import dotenv from 'dotenv';
import path from 'path';
import DownloadManager from './download/DownloadManager';
import XBRL, { Quarter, Filing } from './XBRL';

console.log('hello world!');
console.log(path.join(__dirname));

(async () => {
  const result = dotenv.config();

  if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
    throw new Error('No downloads directory in .env');
  }

  const downloadManager = new DownloadManager(process.env.DOWNLOADS_DIRECTORY);
  const xbrl = new XBRL(downloadManager);

  //await xbrl.getIndex(2017, Quarter.QTR2);
  xbrl.parseIndex(Filing.F10K);

  // Esquelet:
  // pas 1 - Parsegem totes les https://www.sec.gov/Archives/edgar/full-index/{any}/{QTRN}/

  // pas 2 - obirm/descarreguem xbrl.idx ->
  //fem grep de tot el que tingui 10-K en aquest index
  //(ej:96699|TECHNICAL COMMUNICATIONS CORP|10-K|2019-12-13|edgar/data/96699/0001171843-19-008104.txt)
  // De la url anterior ens quedem amb el CIK (96699) i el numero de despres (sense guions 0001171843-19-008104)
  // Amb aquests dos numeros anem a la seguent url:
  //https://www.sec.gov/Archives/edgar/data/96699/0001171843-19-008104-xbrl.zip
  //(suposo que anar o fer un GET ja fa la descarrega)
  // Parsegem lo de dins (no se com)
})();
