import fs from 'fs';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';
import { Writable } from 'stream';
import moment from 'moment';

class DefaultLogger implements Logger {
  private _logLevel: LogLevel = LogLevel.INFO;
  private output: Writable = process.stdout;
  private label: string = '';
  // private output: Writable = fs.createWriteStream('logs/.log', {
  //   flags: 'a'
  // });
  private static map: Map<string, Logger> = new Map();
  private static readonly MOMENT_FORMAT: string = 'YYYY/MM/DD HH:mm:ss SSS';

  private constructor(label: string) {
    this.label = label;
  }

  public static get(key: string): Logger {
    if (DefaultLogger.map.get(key) === undefined) {
      DefaultLogger.map.set(key, new DefaultLogger(key));
    }
    return DefaultLogger.map.get(key)!;
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

  debug(...messages: any[]): void {
    if (this._logLevel <= LogLevel.DEBUG) {
      this.log(`DEBUG`, messages);
    }
  }

  info(...messages: any[]): void {
    if (this._logLevel <= LogLevel.INFO) {
      this.log(`INFO`, messages);
    }
  }

  warning(...messages: any[]): void {
    if (this._logLevel <= LogLevel.WARNING) {
      this.log(`WARNING`, messages);
    }
  }

  error(...messages: any[]): void {
    if (this._logLevel <= LogLevel.ERROR) {
      this.log(`ERROR`, messages);
    }
  }

  private log(type: string, ...args: any[]): void {
    this.output.write(
      `${moment().format(DefaultLogger.MOMENT_FORMAT)}|{${type}} [${
        this.label
      }] ${args.join(';')}\n`
    );
  }
}

export default DefaultLogger;
