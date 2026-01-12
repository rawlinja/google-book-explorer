#!/bin/bash
echo "🔍 Measuring esbuild bundle size..."

yarn config set nodeLinker pnp
yarn install
yarn build
size_pnp=$(du -sh dist | awk '{print $1}')

yarn config set nodeLinker node-modules
yarn install
yarn build
size_mod=$(du -sh dist | awk '{print $1}')

echo ""
echo "✅ Results:"
echo "PnP bundle size:        $((size_pnp/1024/1024)) MB"
echo "node_modules bundle size $((size_mod/1024/1024)) MB"
echo ""
echo "PnP saves approx:       $(( (size_mod-size_pnp)/1024/1024 )) MB"
