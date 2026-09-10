import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  { files: ['src/**/*.{js,jsx}'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { react, 'react-hooks': reactHooks }, settings: { react: { version: 'detect' } }, rules: { 'no-unused-vars': 'error', 'react/jsx-uses-vars': 'error', ...reactHooks.configs.recommended.rules, 'react-hooks/set-state-in-effect': 'off' } },
];
