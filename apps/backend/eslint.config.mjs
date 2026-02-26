import { backendConfig } from "@repo/eslint-config/backend";
import { defineConfig } from "eslint/config";

export default defineConfig(...backendConfig, {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
