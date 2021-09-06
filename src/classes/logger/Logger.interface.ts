import { LogLevel } from './LogLevel';

export interface Logger {
  logLevel: LogLevel;
  debug(...message: unknown[]): void;
  info(...message: unknown[]): void;
  warning(...message: unknown[]): void;
  error(...message: unknown[]): void;
  setOutput(output: string): void;
}
