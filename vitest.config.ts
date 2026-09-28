import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // e2e/ holds Playwright specs (npm run test:e2e), not Vitest ones —
    // both use a .spec.ts suffix, so Vitest's default include would try
    // (and fail) to bundle Playwright's own test runner otherwise.
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
