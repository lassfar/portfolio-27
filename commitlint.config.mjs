/** @type {import('@commitlint/types').UserConfig} */
export default {
  parserPreset: {
    parserOpts: {
      // Expected format: P27-5 - feat(Hero): Add entrance animation
      headerPattern: /^(P27-\d+) - (\w+)(?:\(([^)]*)\))?: (.+)$/,
      headerCorrespondence: ["taskId", "type", "scope", "subject"],
    },
  },
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "refactor",
        "docs",
        "test",
        "style",
        "perf",
        "ci",
        "build",
        "revert",
      ],
    ],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-case": [2, "always", "sentence-case"],
  },
};
