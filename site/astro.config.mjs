import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  output: 'static',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    resolve: {
      alias: {
        '@ui': fileURLToPath(new URL('../ui', import.meta.url)),
      },
    },
    plugins: [tailwindcss()],
  },
});
