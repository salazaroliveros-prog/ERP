import nextEsLintConfig from 'eslint-config-next';

export default [
  ...nextEsLintConfig,
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'out/', 'build/', '*.tsbuildinfo'],
  },
];
