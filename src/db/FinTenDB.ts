import NeDB from 'nedb';
import feathers from '@feathersjs/feathers';
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
    await this.app.service('secgov').create(o);
  }
}

export default FinTenDB;
