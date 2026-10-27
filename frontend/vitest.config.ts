import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 60000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main.tsx',
        '*.config.*',
        'dist/',
      ],
      thresholds: {
        lines: 0,  // Will be raised to 80 in PR 14
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
