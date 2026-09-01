import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const intentionalUnusedPattern = "^_";

const commonTypeScriptRules = {
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      fixStyle: "inline-type-imports",
      prefer: "type-imports"
    }
  ],
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: intentionalUnusedPattern,
      caughtErrorsIgnorePattern: intentionalUnusedPattern,
      destructuredArrayIgnorePattern: intentionalUnusedPattern,
      varsIgnorePattern: intentionalUnusedPattern
    }
  ]
};

export const baseConfig = defineConfig(
  globalIgnores([
    "**/.angular/**",
    "**/.cache/**",
    "**/.turbo/**",
    "**/coverage/**",
    "**/dist/**",
    "**/*.d.ts",
    "**/node_modules/**",
    "**/pnpm-lock.yaml"
  ]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    }
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [eslint.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module"
    }
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.es2022,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: "module"
    },
    rules: commonTypeScriptRules
  }
);
