import { Request, Response, Router } from 'express';
import TokenFactory from '../auth/TokenFactory';
import Controller from './Controller.interface';
import { default as LOGGER } from '../../classes/logger/DefaultLogger';
import UserModel from '../../classes/db/models/User';
import { Logger } from '../../classes/logger/Logger.interface';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

class UsersController implements Controller {
  public readonly path = '/users';
  public readonly router = Router();
  private logger: Logger = LOGGER.get(this.constructor.name);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/signup', this.signup.bind(this));
    this.router.post('/login', this.login.bind(this));
  }

  /**
   * Description: signup to be able to use this API.
   *
   * URL: https://finten.weirwood.ai/users/signup
   *
   * Method: POST
   *
   * Headers:
   *  -Content-Type: 'application/x-www-form-urlencoded'
   *
   * Data:
   *  -username: required
   *  -password: required
   *  -email: required
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *username:
   *      +type: string
   *      +content: your username
   *    *email:
   *      +type: string
   *      +content: your email
   *    *isPremium:
   *      +type: boolean
   *      +content: your premium status
   *    *token:
   *      +type: string
   *      +content: your authentication JWT, necessary for most of the endpoints of this API
   *
   * Error response:
   *  -Code: 400 Bad request
   *    *possible reasons:
   *      +missing data (username, password or email are missing)
   *      +username already registered
   *      +email already registered
   *
   *  -Code: 500 Internal server error
   *    *the request could not be processed
   *    *the error is sent in a JSON response (under the property error)
   */
  private async signup(req: Request, res: Response) {
    const { username, password, email, recaptcha } = req.body;

    if (!username || !password || !email || !recaptcha) {
      return res.status(400).send({ error: 'missing data' });
    }

    try {
      if (!this.isRecaptchaValid(recaptcha)) {
        return res.send(403).send({ error: 'invalid request' });
      }

      if (username) return res.sendStatus(418).end();

      const user = await new UserModel({ username, password, email }).save();

      this.logger.info(`New user signed up successfully: ${JSON.stringify(user, null, 2)}`);
      const payload = { id: user._id };

      return res.status(200).json({
        username: user.username,
        email: user.email,
        isPremium: user.isPremium,
        token: TokenFactory.sign(payload)
      });
    } catch (e) {
      if (/duplicate key/.test(e.toString())) {
        const duplicateKey = Object.keys(e.keyPattern)[0];
        return res.status(400).json({ error: `${duplicateKey} already registered` });
      }

      return res.status(500).json({ error: e.toString() });
    }
  }

  /**
   * Description: login to receive your JWT, necessary to use any of the other
   * endpoints of this API.
   *
   * URL: https://finten.weirwood.ai/users/login
   *
   * Method: POST
   *
   * Headers:
   *  -Content-Type: 'application/x-www-form-urlencoded'
   *
   * Data:
   *  -username: required
   *  -password: required
   *
   * Success response:
   *  -Code: 200
   *  -Content: JSON with the following properties
   *    *username:
   *      +type: string
   *      +content: your username
   *    *email:
   *      +type: string
   *      +content: your email
   *    *isPremium:
   *      +type: boolean
   *      +content: your premium status
   *    *token:
   *      +type: string
   *      +content: your authentication JWT, necessary for most of the endpoints of this API
   *
   * Error response:
   *  -Code: 400 Bad request
   *    *possible reasons:
   *      +missing data (no username or no password provided)
   *      +invalid credentials
   *
   *  -Code: 500 Internal server error
   *    *the request could not be processed
   *    *the error is sent in a JSON response (under the property error)
   */
  private async login(req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }

    try {
      const user = await UserModel.findOne({ username });

      if (user === null) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const payload = { id: user._id };
      this.logger.info(`User ${username} logged in successfully!`);
      return res.status(200).json({
        username,
        email: user.email,
        isPremium: user.isPremium,
        token: TokenFactory.sign(payload)
      });
    } catch (e) {
      res.status(500).json({ error: e.toString() });
    }
  }

  private async isRecaptchaValid(recaptcha: string): Promise<boolean> {
    if (!process.env.PROJECT_NUMBER) throw new Error('Invalid project number for recaptcha');
    if (!process.env.RECAPTCHA_KEY) throw new Error('Invalid recaptcha key');

    const client = new RecaptchaEnterpriseServiceClient();
    const [result] = await client.createAssessment({
      parent: client.projectPath(process.env.PROJECT_NUMBER),
      assessment: { event: { token: recaptcha, siteKey: process.env.RECAPTCHA_KEY } }
    });
    this.logger.debug(`Recaptcha risk analysis: ${JSON.stringify(result.riskAnalysis, null, 2)}`);

    return (result.riskAnalysis?.score || 0) > 0.7;
  }
}

export default UsersController;
