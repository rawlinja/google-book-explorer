export const baseConfig = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'esm',
  outdir: 'dist',
  entryNames: 'index',
};
