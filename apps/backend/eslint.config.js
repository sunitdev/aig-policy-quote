import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

import { baseConfig } from "../../eslint.base.config.js";

const restrictedBackendImportPatterns = [
  "@angular/*",
  "zone.js",
  "apps/frontend/*",
  "../frontend/*",
  "../../frontend/*"
];

export function backendConfig({ tsFiles = ["**/*.ts"] } = {}) {
  return defineConfig({
    files: tsFiles,
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: true
        }
      ],
      "no-console": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: restrictedBackendImportPatterns,
              message: "Backend code must not depend on Angular or frontend application modules."
            }
          ]
        }
      ]
    }
  });
}

export default defineConfig(
  globalIgnores(["eslint.config.js", "dist/**", "coverage/**", "node_modules/**"]),
  ...baseConfig,
  ...backendConfig()
);
