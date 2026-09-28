import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

// @nuxt/test-utils/playwright's `goto` fixture boots an ephemeral Nuxt
// server per worker (via the `nuxt` option below) — no separate `npm run
// dev` needed in another terminal, `npm run test:e2e` just works.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
