import jwt from 'jsonwebtoken';
import { secret } from './Passport';

export default class TokenFactory {
  public static sign(data: object) {
    return jwt.sign(data, secret);
  }
}
