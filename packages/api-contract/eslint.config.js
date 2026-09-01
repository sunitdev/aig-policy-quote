import { defineConfig, globalIgnores } from "eslint/config";

import { baseConfig } from "../../eslint.base.config.js";

const restrictedApiContractImportPatterns = [
  "@angular/*",
  "@fastify/*",
  "@middy/*",
  "apps/*",
  "../apps/*",
  "../../apps/*",
  "aws-lambda"
];

export function apiContractConfig({ tsFiles = ["**/*.ts"] } = {}) {
  return defineConfig({
    files: tsFiles,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: restrictedApiContractImportPatterns,
              message:
                "The API contract package must stay framework-neutral and must not import app runtime code."
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
  ...apiContractConfig()
);
