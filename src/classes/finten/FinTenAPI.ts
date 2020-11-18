import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { default as LOGGER } from '../logger/DefaultLogger';
import api from '../../routes/api/api';
import cors from 'cors';
import { Server } from 'http';
import Controller from './controllers/Controller.interface';

class FinTenAPI {
  private readonly app: Application;
  private readonly port: number = parseInt(process.env.PORT || '3000');

  constructor(controllers: Controller[]) {
    //establish the connection with the DB at the very beginning
    this.app = express();
    this.initialiseMiddlewares();
    this.initialiseControllers(controllers);
  }

  private initialiseMiddlewares() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private initialiseControllers(controllers: Controller[]) {
    for (const controller of controllers) {
      this.app.use(controller.path, controller.router);
    }
  }

  setRoutes(): FinTenAPI {
    //loggin middleware
    this.app.use('', (req, res, next) => {
      console.log(`requested ${req.url}`);
      next();
    });

    //greeting route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        greeting: 'You reached the FinTen API! 🥳'
      });
    });

    this.app.use('', api);

    return this;
  }

  listen(): Server {
    return this.app.listen(this.port, () =>
      LOGGER.get(this.constructor.name).info(`Listening on port ${this.port}!`)
    );
  }
}

export default FinTenAPI;
