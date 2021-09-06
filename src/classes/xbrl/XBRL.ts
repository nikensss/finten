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
