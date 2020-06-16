import fs from 'fs';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';
import { Writable } from 'stream';
import moment from 'moment';

class DefaultLogger implements Logger {
  private _logLevel: LogLevel = LogLevel.INFO;
  private output: Writable = process.stdout;
  // private output: Writable = fs.createWriteStream('logs/.log', {
  //   flags: 'a'
  // });
  private static map: Map<string, Logger> = new Map();
  private static readonly MOMENT_FORMAT: string = 'YYYY/MM/DD HH:mm:ss SSS';
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
    this.output.write(
      `${moment().format(DefaultLogger.MOMENT_FORMAT)}|${args.join(';')}\n`
    );
  }
}

export default DefaultLogger;
