module.exports = {
  testEnvironment: "node",
  watchman: false,
  testMatch: ["**/test/**/*.test.ts"],
  transform: { "^.+\\.tsx?$": ["ts-jest", {}] },
};
