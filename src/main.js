// Main JavaScript for ZGRAD website - ES6 Module Entry Point
// This file is the entry point for Vite bundler

// Import CSS files
import '../css/main.css';
import '../css/navbar.css';
import '../css/landing-section.css';
import '../css/homigrad-section.css';
import '../css/features-section.css';
import '../css/gamemode-section.css';
import '../css/webstore-section.css';
import '../css/discord-section.css';
import '../css/cms-section.css';
import '../css/help-section.css';
import '../css/footer.css';

// Note: External libraries are loaded via CDN in HTML for better caching
// - GSAP (with ScrollTrigger and ScrollToPlugin)
// - Lenis smooth scroll
// - Swiper
// - Vanilla LazyLoad

// Import tracking
import '../js/tracking.js';

// Main.js contains GSAP Manager and Video Manager classes
import '../js/main.js';

// Import page-specific modules (will auto-execute when loaded)
import '../js/navbar.js';
import '../js/landing-section.js';
import '../js/homigrad-section.js';
import '../js/help-section.js';
import '../js/webstore-section.js';
import '../js/discord-section.js';
import '../js/footer.js';
import '../js/bloodsplatter-animations.js';
import '../js/showcase-animations.js';
import '../js/gamemode-swiper.js';

console.log('ZGRAD website initialized successfully with Vite');

