import * as esbuild from 'esbuild';
import * as fs from 'fs';
import { baseConfig } from './esbuild.config.js';

await esbuild.build({
  ...baseConfig,
  minify: true,
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL ?? ''),
  },
});

fs.copyFileSync('index.html', 'dist/index.html');
