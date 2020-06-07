import FinTen from '../src/FinTen';

declare module 'express-serve-static-core' {
  interface Request {
    finten?: FinTen;
  }
}
