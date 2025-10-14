import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://thebetblog.com',
  trailingSlash: 'always',
  integrations: [react(), tailwind()],
  output: 'static',
  build: {
    assets: '_astro'
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'sanity-vendor': ['@sanity/client', '@sanity/image-url'],
            'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge']
          }
        }
      }
    }
  }
});