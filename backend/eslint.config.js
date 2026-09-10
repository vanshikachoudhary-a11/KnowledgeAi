export default [
  { ignores: ['uploads/**', 'node_modules/**'] },
  { files: ['src/**/*.js', 'tests/**/*.js'], rules: { 'no-unused-vars': 'error' } },
];
