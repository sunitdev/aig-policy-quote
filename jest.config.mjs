export default {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/scripts/**/*.test.ts",
    "<rootDir>/scripts/**/*.spec.ts",
    "<rootDir>/scripts/**/*.test.mjs",
    "<rootDir>/scripts/**/*.spec.mjs",
    "<rootDir>/apps/**/*.test.ts",
    "<rootDir>/apps/**/*.spec.ts",
    "<rootDir>/apps/**/*.test.mjs",
    "<rootDir>/apps/**/*.spec.mjs",
    "<rootDir>/packages/**/*.test.ts",
    "<rootDir>/packages/**/*.spec.ts",
    "<rootDir>/packages/**/*.test.mjs",
    "<rootDir>/packages/**/*.spec.mjs"
  ],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
        useESM: true
      }
    ]
  },
  moduleNameMapper: {
    "^@policy-quote/api-contract$": "<rootDir>/packages/api-contract/src/index.ts"
  },
  clearMocks: true
};
