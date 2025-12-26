// @ts-check
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['node_modules/**', '.expo/**', 'android/**', 'ios/**', 'dist/**', '**/*.config.js'],
  },
  ...compat.extends('expo', 'prettier'),
  {
    rules: {
      'prettier/prettier': 'off',
    },
  },
];
