/* eslint-disable @typescript-eslint/ban-types */
import jwt from 'jsonwebtoken';
import { secret } from './Passport';

export default class TokenFactory {
  public static sign(data: string | object): string {
    return jwt.sign(data, secret);
  }
}
