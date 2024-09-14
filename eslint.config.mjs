import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    ignores: ["node_modules", "dist"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js global variables
        NodeJS: true,
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "prettier/prettier": "error",
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"], // Apply Jest-related settings only to test files
    languageOptions: {
      globals: {
        ...globals.jest, // Include Jest globals (describe, it, expect, etc.)
      },
    },
    env: {
      jest: true, // Enable Jest environment for test files
    },
    plugins: {
      jest: pluginJs, // Optional: ESLint plugin for Jest
    },
    extends: [
      "plugin:jest/recommended", // Optional: Use Jest-specific recommended linting rules
    ],
    rules: {
      // You can add or override Jest-specific rules here if needed
    },
  },
  prettierConfig,
];
