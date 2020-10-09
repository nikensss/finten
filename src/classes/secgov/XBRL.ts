import { Filing } from '../db/models/Filing';

class XBRL {
  private data: Filing;

  constructor(data: Filing) {
    this.data = data;
  }

  /**
   * Returns the XBRL data.
   */
  get(): Filing {
    return this.data;
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
