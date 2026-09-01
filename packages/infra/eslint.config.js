import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

import { baseConfig } from "../../eslint.base.config.js";

export default defineConfig(
  globalIgnores(["eslint.config.js", "cdk.out/**", "dist/**", "node_modules/**"]),
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.node
      }
    },
    rules: {
      "no-console": "off"
    }
  }
);
