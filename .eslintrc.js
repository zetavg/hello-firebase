/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const RulesDirPlugin = require('eslint-plugin-rulesdir');
RulesDirPlugin.RULES_DIR = [path.resolve(__dirname, 'eslint-rules')];

module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'rulesdir'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'react-app',
    'react-app/jest',
  ],
  rules: {
    'rulesdir/app-variable-usage': 'error',
  },
};
