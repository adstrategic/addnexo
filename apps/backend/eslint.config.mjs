import { backendConfig } from "@repo/eslint-config/backend";
import { defineConfig } from "eslint/config";

export default defineConfig(...backendConfig, {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "@typescript-eslint/no-empty-object-type": "off",
    "perfectionist/sort-modules": "off",
    "perfectionist/sort-objects": "off",

    "@typescript-eslint/restrict-template-expressions": {
      allow: ["number"],
    },
  },
});
