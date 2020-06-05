// import fs, { WriteStream } from 'fs';
// import { Writable } from 'stream';
// import chalk from 'chalk';
// class TestClass {
//   public readonly data: string;
//   constructor(d: string) {
//     this.data = d;
//   }

//   printClassName() {
//     console.log(this.constructor.name);
//   }
// }

// const t: TestClass = new TestClass('data that was given');

// t.printClassName();
// const ws: Writable = fs.createWriteStream('./logs/test.log', { flags: 'w' });
// const stdout: Writable = process.stdout;
// ws.write(new Date().toLocaleString() + '\n');
// ws.write('writting stuff to created write stream\n');
// ws.write('second write\n');
// ws.write('third write\n');
// ws.write('fourth write\n');
// ws.write('fifth write\n');
// stdout.write(chalk.red('writting stuff to stdout\n'));
// stdout.write(chalk.red('writting stuff to stdout\n'));
// stdout.write(chalk.red('writting stuff to stdout\n'));
// stdout.write(chalk.red('writting stuff to stdout\n'));

let i: number = 0;
const interval = setInterval(() => {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write('Status: ' + i + '%');
  i += Math.round(Math.random() * 10);
  if (i > 100) {
    clearInterval(interval);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write('Status: 100%');
    process.stdout.write('\n');
  }
}, 100);
