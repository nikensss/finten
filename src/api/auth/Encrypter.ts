import bcrypt from 'bcrypt';

export default class Encrypter {
  private static readonly salt = 10;

  public static hash(s: string): Promise<string> {
    return bcrypt.hash(s, Encrypter.salt);
  }

  public static compare(a: string, b: string): Promise<boolean> {
    return bcrypt.compare(a, b);
  }
}
