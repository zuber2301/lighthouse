import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/__tests__/**/*.test.{ts,tsx,js,jsx}'],
  },
})
