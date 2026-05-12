import * as esbuild from 'esbuild';

const ctx = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'esm',
  outdir: 'dist',
  entryNames: 'index',
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL ?? 'http://localhost:3001'),
  },
});

await ctx.watch();
await ctx.serve({ servedir: '.', port: 3000, host: '0.0.0.0', fallback: 'index.html' });
console.log('Dev server running at http://localhost:3000');
