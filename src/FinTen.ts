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
  private downloadsDirectory: string;

  constructor(downloadsDirectory: string) {
    this.downloadsDirectory = downloadsDirectory;
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

    const secgov = new SecGov(this.downloadsDirectory);
    const xbrl = new XBRL();
    const db = new FinTenDB();
    secgov.flush();

    await secgov.getIndices(start, end);

    let filings = xbrl.parseIndices(
      secgov.listDownloads('.idx'),
      FormType.F10K
    );

    DefaultLogger.get(this.constructor.name).info(
      this.constructor.name,
      `found ${filings.length} 10-K filings`
    );

    secgov.flush();
    let txts: string[] = [];
    let xml: string, parsedXbrl: any;

    let partialPaths: string[] = (
      await db.find({
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

      txts = await secgov.get(filing);
      for (let txt of txts) {
        try {
          xml = xbrl.parseTxt(txt);
          parsedXbrl = await xbrl.parseXBRL(xml);
          parsedXbrl.partialPath = filing.partialPath;
          await db.create(parsedXbrl);
        } catch (ex) {
          DefaultLogger.get(this.constructor.name).warning(
            this.constructor.name,
            `Error while parsing txt to XBRL at ${txt}:\n${ex}`
          );
        } finally {
          secgov.flush();
        }
      }
    }

    secgov.flush();
  }

  public static async main(): Promise<void> {
    const finten = FinTen.create();

    finten.fill(2010, 2019);
  }
}

export default FinTen;
