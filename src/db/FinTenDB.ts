import NeDB from 'nedb';
import feathers, { Params } from '@feathersjs/feathers';
import express, { Application } from '@feathersjs/express';
import socketio from '@feathersjs/socketio';
import service from 'feathers-nedb';

const secgov = new NeDB({
  filename: './fintendb/secgov.db',
  autoload: true
});

class FinTenDB {
  private app: Application;
  constructor() {
    this.app = express(feathers());
    this.app.use(express.json());
    this.app.use(
      '/secgov',
      service({
        Model: secgov,
        paginate: false
      })
    );
  }

  async create(o: any) {
    if (await this.exists(o)) {
      return;
    }
    await this.app.service('secgov').create(o);
  }

  async find(params?: Params) {
    console.log(params?.query);
    return await this.app.service('secgov').find(params);
  }

  async exists(o: any): Promise<boolean> {
    const r = await this.find({
      query: {
        EntityCentralIndexKey: o.EntityCentralIndexKey,
        DocumentType: o.DocumentType,
        DocumentFiscalYearFocus: o.DocumentFiscalYearFocus,
        DocumentFiscalPeriodFocus: o.DocumentFiscalPeriodFocus
      }
    });
    return r.length > 0;
  }
}

export default FinTenDB;

export const fintendb = new FinTenDB();
