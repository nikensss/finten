import { Filing } from '../db/models/Filing';

class XBRL {
  private filing: Filing;

  constructor(filing: Filing) {
    this.filing = filing;
  }

  /**
   * Returns the XBRL data.
   */
  get(): Filing {
    return this.filing;
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
