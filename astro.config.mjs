import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://donkamscomputers.com',
 
  output: 'static',
  trailingSlash: 'ignore',

  build: {
    inlineStylesheets: 'auto',
  },

  compressHTML: true,

  vite: {
    css: {
      devSourcemap: true,
    },
    build: {
      cssMinify: 'lightningcss',
    },
  },
});