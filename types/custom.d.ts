import FinTen from '../src/classes/finten/FinTen';

declare module 'express-serve-static-core' {
  interface Request {
    finten?: FinTen;
  }
}
