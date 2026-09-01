import angular from "angular-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

import { baseConfig } from "../../eslint.base.config.js";

const restrictedFrontendImportPatterns = [
  "@middy/*",
  "@fastify/*",
  "apps/backend/*",
  "../backend/*",
  "../../backend/*"
];

const restrictedFrontendRuntimeImports = [
  "aws-lambda",
  "child_process",
  "cluster",
  "crypto",
  "fs",
  "fs/promises",
  "http",
  "https",
  "module",
  "net",
  "os",
  "path",
  "stream",
  "tls",
  "worker_threads",
  "zlib",
  "node:child_process",
  "node:cluster",
  "node:crypto",
  "node:fs",
  "node:fs/promises",
  "node:http",
  "node:https",
  "node:module",
  "node:net",
  "node:os",
  "node:path",
  "node:stream",
  "node:tls",
  "node:worker_threads",
  "node:zlib"
];

export function frontendConfig({ templateFiles = ["**/*.html"], tsFiles = ["**/*.ts"] } = {}) {
  return defineConfig(
    {
      files: tsFiles,
      extends: [...angular.configs.tsRecommended],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.es2022
        }
      },
      processor: angular.processInlineTemplates,
      rules: {
        "@angular-eslint/component-selector": [
          "error",
          {
            prefix: "app",
            style: "kebab-case",
            type: "element"
          }
        ],
        "@angular-eslint/directive-selector": [
          "error",
          {
            prefix: "app",
            style: "camelCase",
            type: "attribute"
          }
        ],
        "@angular-eslint/prefer-on-push-component-change-detection": "warn",
        "@angular-eslint/prefer-standalone": "error",
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: {
              attributes: false
            }
          }
        ],
        "no-console": [
          "warn",
          {
            allow: ["warn", "error"]
          }
        ],
        "no-restricted-imports": [
          "error",
          {
            paths: restrictedFrontendRuntimeImports.map((name) => ({
              name,
              message:
                "Frontend code must not import Node, Lambda, or backend-only runtime modules."
            })),
            patterns: [
              {
                group: restrictedFrontendImportPatterns,
                message: "Frontend code must not depend on backend application modules."
              }
            ]
          }
        ]
      }
    },
    {
      files: templateFiles,
      extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility]
    }
  );
}

export default defineConfig(
  globalIgnores([".angular/**", "coverage/**", "dist/**", "eslint.config.js", "node_modules/**"]),
  ...baseConfig,
  ...frontendConfig({
    templateFiles: ["**/*.html"],
    tsFiles: ["**/*.ts"]
  })
);
