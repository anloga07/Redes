import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { ...globals.browser },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-console": "warn",
      "no-unused-vars": ["warn", { vars: "local" }],
      "no-undef": "off",
      complexity: ["warn", 10],
      "max-lines-per-function": ["warn", { max: 50, skipComments: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]",
          message: "JS-02: usa textContent o createElement en lugar de innerHTML.",
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: "JS-02: usa textContent o createElement en lugar de insertAdjacentHTML.",
        },
      ],
    },
  },
];
