import { FinTen } from '../../src/classes/finten/FinTen';

declare namespace Express {
  interface Request {
    finten?: FinTen;
  }
}
