enum FormType {
  F10K = '10-K',
  F8K = '8-K',
  F10KA = '10-K/A',
  F10KT = '10-KT',
  F10Q = '10-Q'
}

export default FormType;

export const byName = (name: string): FormType => {
  type formTypes = keyof typeof FormType;

  for (const f in FormType) {
    if (FormType[f as formTypes] === name) {
      return FormType[f as formTypes];
    }
  }
  throw new Error(`Unknown filing type: ${name}`);
};
