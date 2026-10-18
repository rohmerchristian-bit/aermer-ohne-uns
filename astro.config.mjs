// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
  site: env.SITE_URL || 'https://aermer-ohne-uns.example',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Keep all CSS in files so the CSP can stay at 'self' without 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  devToolbar: { enabled: false },
  vite: {
    build: {
      // Never inline scripts or assets: the CSP only allows files from our own origin.
      assetsInlineLimit: 0,
    },
  },
});
