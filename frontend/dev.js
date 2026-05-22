import * as esbuild from 'esbuild';
import * as http from 'http';

// Server-side proxy target — never exposed to the browser
const GATEWAY = process.env.GATEWAY_URL ?? process.env.API_URL ?? 'http://localhost:3001';
const ESBUILD_PORT = 3005;

const ctx = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'esm',
  outdir: 'dist',
  entryNames: 'index',
  define: {
    // Empty string → relative URLs → same origin → cookie always sent
    'process.env.API_URL': JSON.stringify(''),
  },
});

await ctx.watch();
await ctx.serve({ servedir: '.', port: ESBUILD_PORT, host: '127.0.0.1', fallback: 'index.html' });

function forward(req, res, targetBase) {
  const target = new URL(req.url, targetBase);
  const opts = {
    hostname: target.hostname,
    port: Number(target.port),
    path: target.pathname + target.search,
    method: req.method,
    headers: { ...req.headers, host: target.host },
  };
  const upstream = http.request(opts, (upstream) => {
    res.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(res);
  });
  upstream.on('error', () => res.destroy());
  req.pipe(upstream);
}

http
  .createServer((req, res) => {
    const toGateway = req.url.startsWith('/api') || req.url.startsWith('/auth/google') || req.url.startsWith('/auth/logout');
    forward(req, res, toGateway ? GATEWAY : `http://127.0.0.1:${ESBUILD_PORT}`);
  })
  .listen(3000, '0.0.0.0', () => {
    console.log(`Dev server  → http://localhost:3000`);
    console.log(`Gateway     → ${GATEWAY}`);
  });
