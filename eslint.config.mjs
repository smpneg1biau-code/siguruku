import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

const enhancedHooksPlugin = {
  ...hooksPlugin,
  rules: {
    ...hooksPlugin.rules,
    "set-state-in-effect": { create: () => ({}) },
    "set-state-in-render": { create: () => ({}) },
  },
};

export default [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "dist/**", "*.js"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "react": reactPlugin,
      "react-hooks": enhancedHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
