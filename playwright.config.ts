import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    headless: false, // set to true for CI
    baseURL: 'http://localhost:5173', // adjust if needed
  },
});
