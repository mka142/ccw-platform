import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./tests/setup/env.ts'],
      hookTimeout: 30000,
      testTimeout: 30000,
      include: ['tests/**/*.test.ts'],
      coverage: { enabled: false },
      reporters: ['default'],
    },
});
