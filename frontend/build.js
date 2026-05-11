import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'esm',
  outdir: 'dist',
  entryNames: 'index',
  minify: true,
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL ?? 'http://localhost:3001'),
  },
});
