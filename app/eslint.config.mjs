// Keep linting configuration in the application root so CI and local checks
// apply the same rules to source, tests, and build configuration.
import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Generated bundles and installed dependencies are not authored code.
  {
    ignores: [".webpack/", "node_modules/", "out/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // The renderer uses JSX, while the same TypeScript rules cover the main
    // process, preload bridge, adapters, modules, and workflow tests.
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
);
