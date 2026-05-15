import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 90_000,
    hookTimeout: 15_000,
    reporters: ['verbose'],
    include: ['tests/e2e/**/*.test.ts'],
  },
})
