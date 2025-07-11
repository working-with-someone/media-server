import eslint from "eslint";
import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import tseslint from "typescript-eslint";

/** @type {eslint.Linter.Config[]} */
export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  jsdoc.configs["flat/recommended"],
  { files: ["**/*.js", "**/*.ts"], languageOptions: { sourceType: "module" } },
  {
    languageOptions: { globals: globals.node },
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/valid-types": "error",
      "jsdoc/check-types": "error",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-param-description": "off",
      "no-unused-vars": "off",
      "no-undef": "error",
      "semi": [2, "always"],
      "quotes": [2, "double"],
      "indent": ["error", 2],
      "no-multiple-empty-lines": ["error", { "max": 1, "maxBOF": 0 }]
    }
  },
);
