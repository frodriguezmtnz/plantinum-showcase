import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The Postgres suites (data.integration, follows.integration) share one
    // database and assert exact global boards, so they must not overlap.
    // Without a test DB they are skipped and unit files can run in parallel.
    fileParallelism: !process.env.TEST_DATABASE_URL,
  },
});
