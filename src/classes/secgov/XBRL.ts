class XBRL {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  /**
   * Returns the XBRL data.
   */
  get(): any {
    return this.data;
  }

  set partialPath(partialPath: string) {
    this.data.partialPath = partialPath;
  }
}

export default XBRL;

export const enum Quarter {
  QTR1 = 'QTR1',
  QTR2 = 'QTR2',
  QTR3 = 'QTR3',
  QTR4 = 'QTR4'
}
