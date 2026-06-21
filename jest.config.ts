import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "lib-and-backend",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/tests/contract/**/*.ts",
        "<rootDir>/tests/integration/**/*.ts"
      ],
      transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" }
    },
    {
      displayName: "app",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/component/**/*.tsx"],
      transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]
    }
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};

export default config;
