/* eslint-disable */
module.exports = function () {
  return {
    files: [
      'src/**/*.ts',
      'test/**/*.txt',
      'test/**/*.idx',
      {
        pattern: '.env',
        instrument: false
      }
    ],

    tests: ['test/**/*.spec.ts'],

    env: {
      type: 'node'
    },
    setup: function () {
      require('dotenv').config();
      console.log(`Wallaby setup: ${process.env.DOWNLOADS_DIRECTORY}`);
    }
  };
};
