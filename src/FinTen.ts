import dotenv from 'dotenv';
import XBRL from './secgov/XBRL';
import FormType from './filings/FormType';
import FinTenDB, { fintendb } from './db/FinTenDB';
import SecGov from './secgov/SecGov';
import express, { Application } from 'express';
import { Express } from 'express-serve-static-core';
import bodyParser from 'body-parser';
import api from './routes/api/api';
import DefaultLogger from './logger/DefaultLogger';
import { LogLevel } from './logger/LogLevel';
import FinTenAPI from './FinTenAPI';

class FinTen {
  private secgov: SecGov;
  private xbrl: XBRL;
  private db: FinTenDB;

  constructor(downloadsDirectory: string) {
    this.secgov = new SecGov(downloadsDirectory);
    this.xbrl = new XBRL();
    this.db = fintendb;
  }

  public static asAPI() {
    const fintenAPI = new FinTenAPI();
    fintenAPI.setRoutes().listen();
  }

  public static create(): FinTen {
    const result = dotenv.config();

    if (typeof process.env.DOWNLOADS_DIRECTORY !== 'string') {
      throw new Error('No downloads directory in .env');
    }
    return new FinTen(process.env.DOWNLOADS_DIRECTORY);
  }

  public async fill(start: number, end: number = start) {
    DefaultLogger.get(this.constructor.name).logLevel = LogLevel.DEBUG;
    this.secgov.flush();

    await this.secgov.getIndices(start, end);

    let filings = this.xbrl.parseIndices(
      this.secgov.listDownloads('.idx'),
      FormType.F10K
    );

    DefaultLogger.get(this.constructor.name).info(
      this.constructor.name,
      `found ${filings.length} 10-K filings`
    );

    this.secgov.flush();
    let txts: string[] = [];
    let xml: string, xbrl: any;

    let partialPaths: string[] = (
      await this.db.find({
        query: {
          $select: ['partialPath']
        }
      })
    ).map((p: any) => p.partialPath);

    for (let filing of filings) {
      if (partialPaths.includes(filing.partialPath)) {
        DefaultLogger.get(this.constructor.name).info(
          this.constructor.name,
          'skipping download (already in db)'
        );
        continue;
      }

      txts = await this.secgov.get(filing);
      for (let txt of txts) {
        try {
          xml = this.xbrl.parseTxt(txt);
          xbrl = await this.xbrl.parseXBRL(xml);
          xbrl.partialPath = filing.partialPath;
          await this.db.create(xbrl);
        } catch (ex) {
          DefaultLogger.get(this.constructor.name).warning(
            this.constructor.name,
            `Error while parsing txt to XBRL at ${txt}:\n${ex}`
          );
        } finally {
          this.secgov.flush();
        }
      }
    }

    this.secgov.flush();
  }

  public static async main(): Promise<void> {
    const finten = FinTen.create();

    finten.fill(2010, 2019);
  }
}

export default FinTen;
