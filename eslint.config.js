import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },
  {
    // shadcn/ui primitives export their variant helpers next to the component.
    files: ["src/components/ui/**/*.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // The API server, scripts and API tests run on Node.
    extends: [js.configs.recommended],
    files: ["server.js", "server/**/*.js", "scripts/**/*.mjs", "tests/api/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_" }],
    },
  },
);
