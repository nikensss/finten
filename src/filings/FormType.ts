enum FormType {
  F10K = '10-K',
  F8K = '8-K'
}

export default FormType;

export const asFiling = (name: string): FormType => {
  type formTypes = keyof typeof FormType;

  for (const f in FormType) {
    if (FormType[f as formTypes] === name) {
      return FormType[f as formTypes];
    }
  }
  throw new Error(`Unknown filing type: ${name}`);
};
