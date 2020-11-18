/* eslint-disable */
module.exports = function (w) {
  return {
    name: 'FinTen',
    runMode: 'onsave',
    files: [
      'src/**/*.ts',
      'test/**/*.txt',
      'test/**/*.idx',
      'test/**/*.csv',
      {
        pattern: '.env',
        instrument: false
      }
    ],
    tests: ['test/**/*.spec.ts'],
    // trace: true,
    env: {
      type: 'node'
    },
    setup: function () {
      require('dotenv').config();
      console.log(`Wallaby setup: ${process.env.DOWNLOADS_DIRECTORY}`);
    },
    workers: { restart: true }
  };
};
