export default [
  {
    languageOptions: {
      ecmaVersion: 11,
      sourceType: 'module',
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        browser: true,
        node: true,
        es6: true,
        log: 'readonly' // build-injected debug logger shim (see LOG_SHIM in esbun.js)
      }
    },
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'prefer-template': 'error'
    }
  }
];
