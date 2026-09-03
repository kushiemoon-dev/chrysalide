import { defineConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/lib/resources-data.ts',
        'src/lib/types.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
})
