import fs from 'fs';
import moment from 'moment';
import path from 'path';
import { Writable } from 'stream';
import { Logger } from './Logger.interface';
import { LogLevel } from './LogLevel';

class DefaultLogger implements Logger {
  private _logLevel: LogLevel = LogLevel.DEBUG;
  private label: string;
  private output: Writable = process.stdout;
  private static map: Map<string, Logger> = new Map();
  private static readonly MOMENT_FORMAT: string = 'YYYY/MM/DD HH:mm:ss SSS';

  private constructor(label: string) {
    this.label = label;

    if (process.env.ENV === 'TEST') {
      this.setOutput('logs/.log');
    }
  }

  public static get(key: string): Logger {
    if (DefaultLogger.map.get(key) === undefined) {
      DefaultLogger.map.set(key, new DefaultLogger(key));
    }
    const logger = DefaultLogger.map.get(key);

    return logger as Logger;
  }

  setOutput(destinationFile: string): void {
    if (!fs.existsSync(destinationFile)) {
      fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
    }

    this.output = fs.createWriteStream(destinationFile, {
      flags: 'as+'
    });
  }

  get logLevel(): LogLevel {
    return this._logLevel;
  }

  set logLevel(logLevel: LogLevel) {
    this._logLevel = logLevel;
  }

  debug(...messages: unknown[]): void {
    if (LogLevel.DEBUG.isLowerPriorityThan(this._logLevel)) {
      return;
    }
    this.log(LogLevel.DEBUG, messages);
  }

  info(...messages: unknown[]): void {
    if (LogLevel.INFO.isLowerPriorityThan(this._logLevel)) {
      return;
    }
    this.log(LogLevel.INFO, messages);
  }

  warning(...messages: unknown[]): void {
    if (LogLevel.WARNING.isLowerPriorityThan(this._logLevel)) {
      return;
    }
    this.log(LogLevel.WARNING, messages);
  }

  error(...messages: unknown[]): void {
    if (LogLevel.ERROR.isLowerPriorityThan(this._logLevel)) {
      return;
    }
    this.log(LogLevel.ERROR, messages);
  }

  private log(level: LogLevel, ...args: unknown[]): void {
    const now = moment().format(DefaultLogger.MOMENT_FORMAT);
    //TODO: we don't want colors in files;
    const color = (s: string) => s; //level.getColor();
    const message = args.map((a) => JSON.stringify(a, this.circularReferenceHelper())).join(';');
    this.output.write(color(`${now}|{${level.getLevel()}} [${this.label}] ${message}\n`));
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
