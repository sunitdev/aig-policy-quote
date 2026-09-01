import { defineConfig } from "eslint/config";

import { backendConfig } from "./apps/backend/eslint.config.js";
import { frontendConfig } from "./apps/frontend/eslint.config.js";
import { baseConfig } from "./eslint.base.config.js";
import { apiContractConfig } from "./packages/api-contract/eslint.config.js";

export default defineConfig(
  ...baseConfig,
  ...backendConfig({
    tsFiles: ["apps/backend/**/*.ts"]
  }),
  ...frontendConfig({
    templateFiles: ["apps/frontend/**/*.html"],
    tsFiles: ["apps/frontend/**/*.ts"]
  }),
  ...apiContractConfig({
    tsFiles: ["packages/api-contract/**/*.ts"]
  })
);
