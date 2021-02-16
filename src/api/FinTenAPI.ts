import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { default as LOGGER } from '../classes/logger/DefaultLogger';
import cors from 'cors';
import { Server } from 'http';
import Controller from './controllers/Controller.interface';
import FinTenDB from '../classes/db/FinTenDB';
import { Logger } from '../classes/logger/Logger.interface';

/**
 * Connects our FinTen database to the Internet so that other people can use the
 * database we have built downloading and parsing the data from SecGov.
 *
 * Use controllers (classes implementing the Controller interface) to create
 * endpoints.
 *
 * Once a new instance is created, call the listen() method to start up the
 * server!
 */
class FinTenAPI {
  private readonly app: Application;
  private readonly port: number = parseInt(process.env.PORT || '3000');
  private logger: Logger = LOGGER.get(this.constructor.name);

  constructor(controllers: Controller[]) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
  }

  private initializeMiddlewares() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    //logging middleware
    this.app.use('', (req, res, next) => {
      this.logger.info(`requested ${req.url} (${req.method})`, {
        headers: req.headers,
        originalUrl: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query
      });
      next();
    });

    //greeting route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        greeting: 'You reached the FinTen API! 🥳'
      });
    });
  }

  private initializeControllers(controllers: Controller[]) {
    for (const controller of controllers) {
      this.app.use(controller.path, controller.router);
    }
  }

  listen(): Server {
    //TODO: ensure test cases don't connect to the real database!
    if (!FinTenDB.getInstance().isConnected()) {
      FinTenDB.getInstance().connect();
    }
    return this.app.listen(this.port, () => this.logger.info(`Listening on port ${this.port}!`));
  }
}

export default FinTenAPI;