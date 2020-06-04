import fs from 'fs';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';
import chalk from 'chalk';
import { Writable } from 'stream';

class DefaultLogger implements Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private static instance: DefaultLogger | null = null;
  private output: Writable = process.stdout;
  private contructor() {}

  public static getInstance(): DefaultLogger {
    if (DefaultLogger.instance === null) {
      DefaultLogger.instance = new DefaultLogger();
    }
    return DefaultLogger.instance;
  }

  setOutput(destinationFile: string): void {
    this.output = fs.createWriteStream(destinationFile, {
      flags: 'a'
    });
  }

  setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  debug(origin: string, ...message: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log(`{DEBUG} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  info(origin: string, ...message: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log(`{INFO} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  warning(origin: string, ...message: any[]): void {
    if (this.logLevel <= LogLevel.WARNING) {
      this.log(`{WARNING} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  error(origin: string, ...message: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.log(`{ERROR} [${origin}] ${message[0]}`, message.slice(1));
    }
  }

  private log(...args: any[]): void {
    this.output.write(args.join(';'));
    this.output.write('\n');
  }
}

export default DefaultLogger;
