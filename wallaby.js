module.exports = function () {
  return {
    files: ['src/**/*.ts', 'test/**/*.txt'],

    tests: ['test/**/*.spec.ts'],

    env: {
      type: 'node'
    }
  };
};
