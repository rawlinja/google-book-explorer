import { build } from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// Recursively collect all .ts files under src/
function getEntryPoints(dir) {
  const entries = [];

  for (const file of readdirSync(dir)) {
    const fullPath = join(dir, file);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      entries.push(...getEntryPoints(fullPath));
    } else if (file.endsWith('.ts') && !file.startsWith('.')) {
      entries.push(resolve(fullPath)); // absolute entry point
    }
  }

  return entries;
}

const entryPoints = getEntryPoints(resolve('src'));

console.log('📦 Building these entry points:');
entryPoints.forEach((ep) => console.log('  ', ep));

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  format: 'esm',
  sourcemap: true,
  target: ['es2022'],
  define: {
    'import.meta.url': '__import.meta.url',
  },
  external: [
    // Node.js built-ins
    'buffer',
    'crypto',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'stream',
    'url',
    'util',
    'zlib',
    // Dependencies
    'express',
    'cookie-parser',
    'cors',
    'jsonwebtoken',
    'nanoid',
    'openai',
    'dotenv',
    'dotenv/config',
    'morgan',
    'helmet',
    'express-session',
    'connect-redis',
    'ioredis',
    'redis',
    'pg',
    'openid-client',
    'tiktoken',
    'express-rate-limit',
  ],
});

console.log('✅ Build complete');
