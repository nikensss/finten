module.exports = function () {
  return {
    files: [
      'src/**/*.ts' // adjust if required
    ],

    tests: [
      'test/**/*.spec.ts' // adjust if required
    ],

    env: {
      type: 'node'
    }
  };
};
