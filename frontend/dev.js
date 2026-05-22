import * as esbuild from 'esbuild';
import * as fs from 'fs';
import { baseConfig } from './esbuild.config.js';

const ctx = await esbuild.context({
  ...baseConfig,
  sourcemap: true,
  define: {
    'process.env.API_URL': JSON.stringify(''),
  },
  banner: {
    js: `new EventSource('/__esbuild').addEventListener('change', () => location.reload());`,
  },
});

fs.copyFileSync('index.html', 'dist/index.html');
await ctx.watch();
await ctx.serve({ port: 3005, host: '0.0.0.0' });
console.log('Watching for changes → http://localhost:3000');
