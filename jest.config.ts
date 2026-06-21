import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "lib-and-backend",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/tests/contract/**/*.ts",
        "<rootDir>/tests/integration/**/*.ts",
        "<rootDir>/tests/unit/**/*.ts"
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
  // ponytail: coverage is scoped to testable logic. Excluded: real
  // GCP-backed adapters (cloudStorageAdapter/documentAiProcessor/
  // vectorSearchIndex/pubsubQueue) which need a live project to exercise
  // meaningfully (T082, not yet provisioned), and one-line
  // composition-root/wiring files (app entry, store/client construction,
  // CLI dispatcher) that have no branching logic of their own. Raise the
  // gate to cover these once a GCP project and frontend dev server exist.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/lib/storage/cloudStorageAdapter.ts",
    "!src/lib/conversion/documentAiProcessor.ts",
    "!src/lib/search/vectorSearchIndex.ts",
    "!src/backend/ingestion/pubsubQueue.ts",
    "!src/app/index.tsx",
    "!src/app/routes/index.tsx",
    "!src/app/store/store.ts",
    "!src/app/queries/queryClient.ts",
    "!src/cli/index.ts"
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
