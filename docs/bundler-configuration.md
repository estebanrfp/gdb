# Bundler Configuration

GenosDB uses dynamic imports with `import.meta.url` for loading optional modules. Some bundlers may require additional configuration to handle this correctly.

## Zero Runtime Dependencies

GenosDB publishes a **self-contained bundle**: the npm package ships only the pre-built `dist/` files, with every build-time library (`ethers`, `pako`, `@msgpack/msgpack`, and the internal GenosRTC module) **inlined at build time**. Installing GenosDB therefore pulls **no transitive npm dependencies**:

```bash
npm install genosdb   # 0 dependencies added
```

This keeps the runtime attack surface minimal and aligned with GenosDB's zero-trust design.

> **Note on `npm audit`:** Tools like `npm audit` may report advisories for `devDependencies` (used only to build the project, e.g. the bundler toolchain). These never reach consumers, since they are not part of the published `dist/` and their code is not present in the bundle.

## Vite

If using Vite, add the following to your `vite.config.js`:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['genosdb']
  }
})
```

This tells Vite to skip pre-bundling GenosDB, allowing the dynamic imports to resolve correctly at runtime.

## Webpack

No additional configuration is typically required for Webpack 5+.

## esbuild / Bun

### Bun Example ([bundler.ts](file:///Users/estebanrfp/.gemini/antigravity/playground/primal-triangulum/bundler.ts))

When using `Bun.build`, add a step to copy the assets after the build completes:

```js
async function build() {
    console.time("Build");
    const result = await Bun.build({
        entrypoints: ['./app.js'],
        outdir: './dist',
        target: 'browser',
    });
    console.timeEnd("Build");
}

await build();
```

No additional configuration required.

## CDN Usage

When loading GenosDB directly from a CDN, no bundler configuration is needed:

```html
<script type="module">
  import { gdb } from 'https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.js'
</script>
```