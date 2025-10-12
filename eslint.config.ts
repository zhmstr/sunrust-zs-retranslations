import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier"
import prettierConfig from "eslint-config-prettier"
import eslintPluginJsonc from 'eslint-plugin-jsonc';

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, prettier },
    extends: ["js/recommended"],
    rules: {
        ...prettierConfig.rules,
    },
    languageOptions: { globals: globals.node },
  },
  ...eslintPluginJsonc.configs['flat/recommended-with-json5'],
  tseslint.configs.recommended,
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },
]);
