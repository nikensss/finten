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

  getEntityCentralIndexKey(): number {
    return this.filing.EntityCentralIndexKey;
  }

  hasTradingSymbol(): boolean {
    return !/Field not found/.test(this.filing.TradingSymbol);
  }

  setTrandingSymbol(tradingSymbol: string): void {
    this.filing.TradingSymbol = tradingSymbol;
  }
}

export default XBRL;
