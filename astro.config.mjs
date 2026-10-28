import { defineConfig } from 'astro/config';

// Root hosting is the default; opt in to a subpath for GitHub Pages builds.
export default defineConfig({
  output: 'static',
  base: process.env.DEPLOY_BASE || '/',
  site: process.env.DEPLOY_SITE || undefined,
  devToolbar: { enabled: false },
});
