import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'
import htmlMinifier from 'vite-plugin-html-minifier'
// Sitemap is now dynamically generated via /sitemap.xml endpoint (functions/sitemap.xml.js)

const DEFAULT_OPTIONS = {
  includePublic: true,
  svg: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupNumericValues: true,
            cleanupIds: {
              minify: true,
              remove: true,
            },
            convertPathData: true,
          },
        },
      },
      'sortAttrs',
      {
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
        },
      },
    ],
  },
  png: {
    quality: 90,
  },
  jpeg: {
    quality: 90,
  },
  jpg: {
    quality: 90,
  },
  tiff: {
    quality: 90,
  },
  gif: {},
  webp: {
    lossless: false,
    quality: 90,
  },
  avif: {
    lossless: false,
  },
  cache: false,
  cacheLocation: undefined,
};

export default defineConfig({
  plugins: [
    preact(),
    ViteImageOptimizer(DEFAULT_OPTIONS),
    htmlMinifier({})
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        servers: resolve(__dirname, 'servers.html'),
        rules: resolve(__dirname, 'rules.html'),
        credits: resolve(__dirname, 'credits.html'),
        discord: resolve(__dirname, 'discord.html'),
        store: resolve(__dirname, 'store.html'),
        // Connect pages - single template, served dynamically by Express
        connectTemplate: resolve(__dirname, 'connect/template.html'),
        // Guide pages
        guidesIndex: resolve(__dirname, 'guides/index.html'),
        guideTemplate: resolve(__dirname, 'guides/template.html'),
        banAppeal: resolve(__dirname, 'guides/ban-appeal.html'),
        playerReport: resolve(__dirname, 'guides/player-report.html'),
        howToPlay: resolve(__dirname, 'guides/how-to-play-homigrad.html'),
        // CMS pages
        cmsIndex: resolve(__dirname, 'cms/index.html'),
        cmsLogin: resolve(__dirname, 'cms/login.html'),
        // Updates page
        updates: resolve(__dirname, 'updates/index.html'),
        // News pages
        newsIndex: resolve(__dirname, 'news/index.html'),
        newsTemplate: resolve(__dirname, 'news/template.html'),
        // Loading screen
        loadingscreen: resolve(__dirname, 'loadingscreen/index.html'),
        // Play page (zgrad.gg/play)
        play: resolve(__dirname, 'play/index.html'),
        // 404 page
        notFound: resolve(__dirname, '404.html')
      },
      plugins: [
        copy({
          targets: [
            { src: 'images', dest: 'dist' },
            { src: 'videos', dest: 'dist' },
            { src: 'favicon.ico', dest: 'dist' },
            { src: 'robots.txt', dest: 'dist' },
            // sitemap.xml is now dynamically generated via functions/sitemap.xml.js
            { src: 'CNAME', dest: 'dist' },
            { src: 'guides/manifest.json', dest: 'dist/guides' }
          ],
          hook: 'writeBundle'
        })
      ]
    }
  }
})

