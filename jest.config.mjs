export default {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/scripts/**/*.test.mjs",
    "<rootDir>/scripts/**/*.spec.mjs",
    "<rootDir>/apps/**/*.test.mjs",
    "<rootDir>/apps/**/*.spec.mjs",
    "<rootDir>/packages/**/*.test.mjs",
    "<rootDir>/packages/**/*.spec.mjs"
  ],
  transform: {},
  clearMocks: true
};
