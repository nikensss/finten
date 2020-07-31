import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { default as LOGGER } from './classes/logger/DefaultLogger';
import api from './routes/api/api';

class FinTenAPI {
  private app: Application;
  private port: number = 3000;

  constructor() {
    this.app = express();
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());
  }

  setRoutes(): FinTenAPI {
    this.app.get('/', (req, res) => {
      res.json({
        greeting: 'You reached the FinTen API! 🥳'
      });
    });

    this.app.use('/api', api);

    return this;
  }

  listen() {
    return this.app.listen(this.port, () =>
      LOGGER.get(this.constructor.name).info(
        this.constructor.name,
        `Listening on port ${this.port}!`
      )
    );
  }
}

export default FinTenAPI;
