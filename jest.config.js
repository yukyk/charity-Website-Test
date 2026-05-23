module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/jest.setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
};
