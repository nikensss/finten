import NeDB from 'nedb';
import feathers, { Params } from '@feathersjs/feathers';
import express, { Application } from '@feathersjs/express';
import socketio from '@feathersjs/socketio';
import service from 'feathers-nedb';

const db = new NeDB({
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
        Model: db,
        paginate: {
          default: 2,
          max: 4
        }
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
    return await this.app.service('secgov').find(params);
  }

  async exists(o: any): Promise<boolean> {
    const r = await this.find({
      paginate: false,
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
