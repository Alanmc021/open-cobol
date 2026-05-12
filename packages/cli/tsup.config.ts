import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { opencobol: 'src/index.ts' },
  format: ['esm'],
  target: 'node20',
  outDir: 'bin',
  outExtension: () => ({ js: '.js' }),
  // Bundle all internal workspace packages into the single output file
  noExternal: [/^@opencobol\//],
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
  minify: false,
  sourcemap: false,
})
