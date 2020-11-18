import { LogLevel } from './LogLevel';

export interface Logger {
  logLevel: LogLevel;
  debug(origin: string, ...message: unknown[]): void;
  info(origin: string, ...message: unknown[]): void;
  warning(origin: string, ...message: unknown[]): void;
  error(origin: string, ...message: unknown[]): void;
  setOutput(output: string): void;
}
