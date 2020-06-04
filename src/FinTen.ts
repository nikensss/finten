import dotenv from 'dotenv';
import XBRL, { Quarter } from './secgov/XBRL';
import FormType from './filings/FormType';
import chalk from 'chalk';
import FinTenDB, { fintendb } from './db/FinTenDB';
import SecGov from './secgov/SecGov';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import api from './routes/api/api';
import DefaultLogger from './logger/DefaultLogger';
import { LogLevel } from './logger/LogLevel';

class FinTen {
  private secgov: SecGov;
  private xbrl: XBRL;
  private db: FinTenDB;
  private app: Application;

  constructor(downloadsDirectory: string) {
    this.secgov = new SecGov(downloadsDirectory);
    this.xbrl = new XBRL();
    this.db = fintendb;
    this.app = express();
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());
  }

  public setDefaultRouting() {
    this.app.get('/', (req, res) => {
      res.json({
        greeting: 'You reached the FinTen API! 🥳'
      });
    });

    this.app.use('/api', api);
  }

  public listen(port: number = 4500) {
    this.app.listen(port, () =>
      DefaultLogger.getInstance().info(
        this.constructor.name,
        `Listening on port ${port}!`
      )
    );
  }

  public static asAPI() {
    const finten = FinTen.getInstance();
    finten.setDefaultRouting();
    finten.listen(4500);
  }

  public static async main(): Promise<void> {
    const finten = FinTen.getInstance();

    finten.secgov.flush();

    await finten.secgov.getIndex(2017, Quarter.QTR2);
    // await finten.secgov.getIndex(2017, Quarter.QTR3);
    // await finten.secgov.getIndex(2018, Quarter.QTR1);

    DefaultLogger.getInstance().setLogLevel(LogLevel.DEBUG);

    let filings = finten.xbrl.parseIndices(
      finten.secgov.listDownloads('.idx'),
      FormType.F10K,
      4
    );

    await finten.secgov.get(...filings);
    DefaultLogger.getInstance().info(
      finten.constructor.name,
      'all downloads finished!'
    );
    DefaultLogger.getInstance().setLogLevel(LogLevel.INFO);

    let xmls = finten.xbrl.parseTxts(finten.secgov.listDownloads('.txt'));
    for (let xml of xmls) {
      DefaultLogger.getInstance().info(
        finten.constructor.name,
        `Parsing: ${xml.name}`
      );
      try {
        const parsedXml = await finten.xbrl.parseXBRL(xml.xml);
        await finten.db.create(parsedXml);
      } catch (ex) {
        DefaultLogger.getInstance().error(finten.constructor.name, ex);
      }
    }

    finten.secgov.flush();
  }

  private static getInstance(): FinTen {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }

    return new FinTen(process.env.DOWNLOADS_DIRECTORY);
  }
}

export default FinTen;
