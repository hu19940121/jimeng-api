import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  dts: true,
  // 将 playwright 标记为外部依赖，不打包进 bundle
  external: ['playwright'],
});
