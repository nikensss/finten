import chalk from 'chalk';

export type Level = 'SILLY' | 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
export class LogLevel {
  private level: Level;
  private priority: number;
  private color: chalk.Chalk;

  private constructor(level: Level, priority: number, color: chalk.Chalk) {
    this.level = level;
    this.priority = priority;
    this.color = color;
  }

  getLevel(): Level {
    return this.level;
  }

  getPriority(): number {
    return this.priority;
  }

  getColor(): chalk.Chalk {
    return this.color;
  }

  isLowerPriorityThan(logLevel: LogLevel): boolean {
    return this.getPriority() < logLevel.getPriority();
  }

  static get SILLY(): LogLevel {
    return new LogLevel('SILLY', 0, chalk.gray);
  }

  static get DEBUG(): LogLevel {
    return new LogLevel('DEBUG', 1, chalk.gray);
  }

  static get INFO(): LogLevel {
    return new LogLevel('INFO', 2, chalk.blueBright);
  }

  static get WARNING(): LogLevel {
    return new LogLevel('WARNING', 3, chalk.yellow);
  }

  static get ERROR(): LogLevel {
    return new LogLevel('ERROR', 4, chalk.red);
  }
}
