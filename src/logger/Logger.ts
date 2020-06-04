import { LogLevel } from './LogLevel';

export interface Logger {
  setLogLevel(logLevel: LogLevel): void;
  debug(origin: string, ...message: any[]): void;
  info(origin: string, ...message: any[]): void;
  warning(origin: string, ...message: any[]): void;
  error(origin: string, ...message: any[]): void;
  setOutput(output: string): void;
}
