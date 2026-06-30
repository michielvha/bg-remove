import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // A concrete origin (not the opaque about:blank) so localStorage works.
        url: 'http://localhost/',
      },
    },
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./tests/unit/setup.ts'],
    clearMocks: true,
  },
});
