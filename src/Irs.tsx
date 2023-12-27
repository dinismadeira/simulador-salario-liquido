export default class Irs {

  static readonly SUBSISTENCE_LEVEL = 9870;

  static readonly LEVELS: Level[] = [
    {tax: .145, limit: 7479},
    {tax: .21, limit: 11284},
    {tax: .265, limit: 15992},
    {tax: .285, limit: 20700},
    {tax: .35, limit: 26355},
    {tax: .37, limit: 38632},
    {tax: .435, limit: 50483},
    {tax: .45, limit: 78834},
    {tax: .48, limit: Infinity}
  ];

  private static computed = false;

  // Compute IRS given collectible gross income and specific deduction
  static calc(gross: number, deductible = 0) {
    Irs.compute();
    const taxable = Math.max(0, gross - deductible);
    const level = Irs.findLevel(taxable);
    const irs = Irs.calcForLevel(taxable, level);
    const maxIrs = Math.max(0, gross - Irs.SUBSISTENCE_LEVEL);
    return Math.min(irs, maxIrs);
  }

  private static findLevel(taxable: number) {
    for (const level of Irs.LEVELS) {
      if (taxable < level.limit) {
        return level;
      }
    }
    throw new Error("Could not find IRS level for: " + taxable);
  }

  private static calcForLevel(taxable: number, level: Level) {
    const previous = level.previous;
    return previous == null ? taxable * level.tax :
        (taxable - previous.limit) * level.tax + (previous.max || 0);
  }

  // precompute max irs for each level
  private static compute() {
    if (!Irs.computed) {
      Irs.computed = true;
      let previous = null;
      for (const level of Irs.LEVELS) {
        level.previous = previous;
        level.max = Irs.calcForLevel(level.limit, level);
        previous = level;
      }
    }
  }
}

type Level = {
  tax: number;
  limit: number;
  max?: number;
  previous?: Level | null;
}
