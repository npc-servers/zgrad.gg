import { defineConfig } from 'vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'
import htmlMinifier from 'vite-plugin-html-minifier'
import Sitemap from 'vite-plugin-sitemap';

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
    ViteImageOptimizer(DEFAULT_OPTIONS),
    htmlMinifier({}),
    Sitemap({ 
      hostname: 'https://zgrad.gg',
      dynamicRoutes: [
        '/servers',
        '/rules',
        '/credits',
        '/discord',
        '/store',
        '/connect/us1',
        '/connect/us2',
        '/connect/us3',
        '/connect/us4',
        '/guides',
        '/guides/ban-appeal',
        '/guides/player-report',
        '/guides/how-to-play-homigrad'
      ]
    })
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
        // Connect pages
        connectUs1: resolve(__dirname, 'connect/us1.html'),
        connectUs2: resolve(__dirname, 'connect/us2.html'),
        connectUs3: resolve(__dirname, 'connect/us3.html'),
        connectUs4: resolve(__dirname, 'connect/us4.html'),
        // Guide pages
        guidesIndex: resolve(__dirname, 'guides/index.html'),
        banAppeal: resolve(__dirname, 'guides/ban-appeal.html'),
        playerReport: resolve(__dirname, 'guides/player-report.html'),
        howToPlay: resolve(__dirname, 'guides/how-to-play-homigrad.html'),
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
            { src: 'sitemap.xml', dest: 'dist' },
            { src: 'CNAME', dest: 'dist' },
            { src: 'guides/manifest.json', dest: 'dist/guides' }
          ],
          hook: 'writeBundle'
        })
      ]
    }
  }
})

