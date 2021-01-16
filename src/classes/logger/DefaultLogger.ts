import fs from 'fs';
import { Logger } from './Logger.interface';
import { LogLevel } from './LogLevel';
import { Writable } from 'stream';
import moment from 'moment';
import chalk from 'chalk';

class DefaultLogger implements Logger {
  private _logLevel: LogLevel = LogLevel.INFO;
  private output: Writable = process.stdout;
  private label: string;
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
    const logger = DefaultLogger.map.get(key);

    return logger as Logger;
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

  debug(...messages: unknown[]): void {
    if (this._logLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', messages);
    }
  }

  info(...messages: unknown[]): void {
    if (this._logLevel <= LogLevel.INFO) {
      this.log('INFO', messages);
    }
  }

  warning(...messages: unknown[]): void {
    if (this._logLevel <= LogLevel.WARNING) {
      this.log('WARNING', messages);
    }
  }

  error(...messages: unknown[]): void {
    if (this._logLevel <= LogLevel.ERROR) {
      this.log('ERROR', messages);
    }
  }

  private log(type: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR', ...args: unknown[]): void {
    const now = moment().format(DefaultLogger.MOMENT_FORMAT);
    const color = this.getColor(type);
    const message = args.map((a) => JSON.stringify(a, this.circularReferenceHelper(), 2)).join(';');
    this.output.write(color(`${now}|{${type}} [${this.label}] ${message}\n`));
  }

  private getColor(level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'): chalk.Chalk {
    switch (level) {
      case 'DEBUG':
        return chalk.gray;
      case 'INFO':
        return chalk.blueBright;
      case 'WARNING':
        return chalk.yellow;
      case 'ERROR':
        return chalk.red;
      default:
        return chalk.gray;
    }
  }

  private circularReferenceHelper() {
    const cache: string[] = [];
    return (key: string, value: string) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    };
  }
}

export default DefaultLogger;
