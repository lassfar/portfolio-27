/** @type {import('@commitlint/types').UserConfig} */
export default {
  parserPreset: {
    parserOpts: {
      // Expected formats:
      //   Single task:  P27-5 - feat(Hero): Add entrance animation
      //   Range:        P27-1..P27-10 - chore(m1): Batch cleanup
      headerPattern: /^(P27-\d+(?:\.\.P27-\d+)?) - (\w+)(?:\(([^)]*)\))?: (.+)$/,
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
