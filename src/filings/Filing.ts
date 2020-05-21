enum Filing {
  F10K = '10-K',
  F8K = '8-K'
}

export default Filing;

export const asFiling = (name: string): Filing => {
  type filingType = keyof typeof Filing;
  for (let f in Filing) {
    if (Filing[f as filingType] === name) {
      return Filing[f as filingType];
    }
  }
  throw new Error(`Unknown filing type: ${name}`);
};
//Object.keys(MyEnum);
