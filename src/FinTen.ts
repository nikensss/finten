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
    DefaultLogger.get(this.constructor.name).setOutput(
      `logs/${this.constructor.name}.log`
    );
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
      DefaultLogger.get(this.constructor.name).info(
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

    DefaultLogger.get(this.constructor.name).logLevel = LogLevel.DEBUG;

    let filings = finten.xbrl.parseIndices(
      finten.secgov.listDownloads('.idx'),
      FormType.F10K,
      4
    );

    finten.secgov.flush();
    let txts: string[] = [];
    let xml: string, xbrl: any;

    let partialPaths: string[] = (
      await finten.db.find({
        query: {
          $select: ['partialPath']
        }
      })
    ).map((p: any) => p.partialPath);

    for (let filing of filings) {
      if (partialPaths.includes(filing.partialPath)) {
        DefaultLogger.get(finten.constructor.name).info(
          finten.constructor.name,
          'skipping download (already in db)'
        );
        continue;
      }

      txts = await finten.secgov.get(filing);
      for (let txt of txts) {
        try {
          xml = finten.xbrl.parseTxt(txt);
          xbrl = await finten.xbrl.parseXBRL(xml);
          xbrl.partialPath = filing.partialPath;
          await finten.db.create(xbrl);
        } catch (ex) {
          DefaultLogger.get(this.constructor.name).warning(
            finten.constructor.name,
            `Error while parsing txt to XBRL at ${txt}:\n${ex}`
          );
        } finally {
          finten.secgov.flush();
        }
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
