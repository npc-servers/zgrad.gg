# ZGRAD.GG

Official website for ZGRAD - The Homigrad Network

## Development

### Prerequisites
- Node.js 20 or higher
- npm

### Setup

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### Build

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Tech Stack

- **Vite** - Build tool & dev server
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modular stylesheets
- **GSAP** - Animations and scroll effects (loaded via CDN)
- **Swiper** - Gamemode carousel (loaded via CDN)
- **Lenis** - Smooth scrolling (loaded via CDN)

## Project Structure

```
zgrad.gg/
├── src/
│   └── main.js           # Vite entry point, imports all CSS and JS modules
├── css/                  # Modular CSS files
│   ├── main.css         # Global styles and variables
│   ├── navbar.css       # Navigation styles
│   ├── landing-section.css
│   ├── homigrad-section.css
│   ├── features-section.css
│   ├── gamemode-section.css
│   ├── webstore-section.css
│   ├── discord-section.css
│   ├── help-section.css
│   └── footer.css
├── js/                   # JavaScript modules
│   ├── main.js          # GSAP Manager and Video Manager
│   ├── navbar.js
│   ├── landing-section.js
│   ├── homigrad-section.js
│   ├── bloodsplatter-animations.js
│   ├── showcase-animations.js
│   ├── gamemode-swiper.js
│   ├── webstore-section.js
│   ├── discord-section.js
│   ├── help-section.js
│   └── footer.js
├── images/               # Static images
├── videos/               # Video files
├── connect/              # Server connect pages
├── guides/               # Help guide pages
├── index.html            # Main landing page
├── servers.html          # Server browser page
├── rules.html            # Rules page
├── credits.html          # Credits page
├── discord.html          # Discord redirect page
├── 404.html              # 404 error page
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
└── .gitignore           # Git ignore rules
```

## Building for Production

The production build is automatically created and deployed via GitHub Actions when code is pushed to the `main` branch.

The build process:
1. Installs dependencies
2. Runs Vite build (`npm run build`)
3. Optimizes images and assets
4. Minifies HTML/CSS/JS
5. Deploys to GitHub Pages

## Key Features

- **Image Optimization** - Automatic optimization of images during build
- **HTML Minification** - Reduced file sizes for faster loading
- **ES6 Modules** - Modern JavaScript module system
- **Code Splitting** - Automatic chunking for optimal loading
- **CSS Bundling** - All styles bundled and optimized
- **Sitemap Generation** - Automatic sitemap generation
- **Asset Hashing** - Cache-busting for updated files

## External Dependencies (CDN)

These are loaded from CDN for better caching across sites:
- GSAP 3.12.2 (with ScrollTrigger and ScrollToPlugin)
- Lenis 1.3.11
- Swiper 11
- Vanilla LazyLoad 19.1.3

**Important:** These CDN scripts load **without** the `defer` attribute to ensure they're available before the Vite module executes. This prevents "undefined" errors when the bundled code tries to use these libraries.

## Notes

- The `dist/` folder is generated during build and should not be committed
- All source files are in the root directories (css/, js/, images/, etc.)
- Vite handles module resolution and bundling
- Development server has HMR (Hot Module Replacement) for fast development

