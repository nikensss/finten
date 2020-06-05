import fs from 'fs';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';
import { Writable } from 'stream';

class DefaultLogger implements Logger {
  private _logLevel: LogLevel = LogLevel.INFO;
  private output: Writable = process.stdout;
  private static map: Map<string, Logger> = new Map();
  private contructor() {}

  public static get(className: string): Logger {
    if (DefaultLogger.map.get(className) === undefined) {
      DefaultLogger.map.set(className, new DefaultLogger());
    }
    return DefaultLogger.map.get(className) as DefaultLogger;
  }

  setOutput(destinationFile: string): void {
    this.output = fs.createWriteStream(destinationFile, {
      flags: 'a'
    });
  }

  get logLevel(): LogLevel {
    return this._logLevel;
  }

  set logLevel(logLevel: LogLevel) {
    this._logLevel = logLevel;
  }

  debug(origin: string, ...message: any[]): void {
    if (this._logLevel <= LogLevel.DEBUG) {
      this.log(`{DEBUG} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  info(origin: string, ...message: any[]): void {
    if (this._logLevel <= LogLevel.INFO) {
      this.log(`{INFO} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  warning(origin: string, ...message: any[]): void {
    if (this._logLevel <= LogLevel.WARNING) {
      this.log(`{WARNING} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  error(origin: string, ...message: any[]): void {
    if (this._logLevel <= LogLevel.ERROR) {
      this.log(`{ERROR} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  private log(...args: any[]): void {
    this.output.write(`${new Date().toLocaleString()}|`);
    this.output.write(args.join(';'));
    this.output.write('\n');
  }
}

export default DefaultLogger;
