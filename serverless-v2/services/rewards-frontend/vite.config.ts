import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Vitest types are loaded automatically when running `vitest`; this keeps tsc happy in tests.
/// <reference types="vitest" />

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const envDir = fs.existsSync(path.join(repoRoot, '.env'))
  ? repoRoot
  : __dirname;

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, envDir, '');
  const port =
    process.env.REWARDS_API_PORT ||
    rootEnv.REWARDS_API_PORT ||
    '5000';
  const rewardsApiTarget =
    process.env.REWARDS_API_PROXY_TARGET ||
    rootEnv.REWARDS_API_PROXY_TARGET ||
    `http://127.0.0.1:${port}`;

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
    server: {
      host: '0.0.0.0',
      port: 4000,
      proxy: {
        '/api': {
          target: rewardsApiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
