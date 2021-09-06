export class Quarter {
  private name: string;

  private constructor(name: string) {
    this.name = name;
  }

  static all(): Quarter[] {
    return [Quarter.QTR1, Quarter.QTR2, Quarter.QTR3, Quarter.QTR4];
  }

  static get QTR1(): Quarter {
    return new Quarter('QTR1');
  }

  static get QTR2(): Quarter {
    return new Quarter('QTR2');
  }

  static get QTR3(): Quarter {
    return new Quarter('QTR3');
  }

  static get QTR4(): Quarter {
    return new Quarter('QTR4');
  }

  getIndex(): number {
    return parseInt(this.name.slice(-1));
  }

  getMonthIndexStart(): number {
    return this.getIndex() * 3 - 2;
  }

  getMonthIndexEnd(): number {
    return this.getIndex() * 3;
  }

  isInTheFuture(year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    if (year !== currentYear) return year > currentYear;

    const currentMonth = now.getMonth() + 1;
    return this.getMonthIndexStart() >= currentMonth;
  }

  toString(): string {
    return this.name;
  }
}
