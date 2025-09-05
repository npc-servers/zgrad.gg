/**
 * UNIFIED BLOODSPLATTER ANIMATION SYSTEM
 * 
 * This system provides ZERO real-time calculation bloodsplatter animations
 * with pre-calculated paths and frame-based lookups for maximum performance.
 * 
 * Used by: showcase-animations.js, servers-page.js, gamemode-section.js
 */

// =============================================================================
// CACHE STORAGE SYSTEMS
// =============================================================================

// Ultra-optimized caching with zero real-time calculations
const bloodsplatterPathCache = new Map();
const bloodsplatterNoisePatterns = new Map();
const bloodsplatterAnimationFrames = new Map();

// =============================================================================
// SPLATTER CONFIGURATIONS
// =============================================================================

// Default configurations for different splatter types
const SPLATTER_CONFIGS = {
    'bloodsplatter-decoration-left': {
        centerX: 80, centerY: 30,
        duration: 0.8,
        delay: 0.1,
        ease: "power3.out"
    },
    'bloodsplatter-decoration-right': {
        centerX: 20, centerY: 70,
        duration: 0.7,
        delay: 0.05,
        ease: "power3.out"
    },
    'bloodsplatter-decoration-ragdoll': {
        centerX: 75, centerY: 40,
        duration: 0.5,
        delay: 0.15,
        ease: "power4.out"
    },
    'bloodsplatter-decoration-medical': {
        centerX: 25, centerY: 35,
        duration: 0.4,
        delay: 0.08,
        ease: "power3.out"
    },
    'bloodsplatter-decoration-gore': {
        centerX: 70, centerY: 60,
        duration: 0.5,
        delay: 0.2,
        ease: "power4.out"
    },
    'bloodsplatter-decoration-cw': {
        centerX: 30, centerY: 45,
        duration: 0.45,
        delay: 0.12,
        ease: "power3.out"
    },
    'bloodsplatter-decoration-classes': {
        centerX: 65, centerY: 25,
        duration: 0.55,
        delay: 0.25,
        ease: "power4.out"
    },
    'bloodsplatter-decoration-header-center': {
        centerX: 50, centerY: 50,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out"
    },
    'server-title-splatter': {
        centerX: 5, centerY: 15,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out"
    }
};

// Unique seeds for each splatter type for visual variety
const SPLATTER_SEEDS = {
    'bloodsplatter-decoration-left': 12.34,
    'bloodsplatter-decoration-right': 56.78,
    'bloodsplatter-decoration-ragdoll': 91.23,
    'bloodsplatter-decoration-medical': 45.67,
    'bloodsplatter-decoration-gore': 89.01,
    'bloodsplatter-decoration-cw': 23.45,
    'bloodsplatter-decoration-classes': 67.89,
    'bloodsplatter-decoration-header-center': 34.56,
    'server-title-splatter': 15.34
};

// =============================================================================
// NOISE GENERATION SYSTEM
// =============================================================================

/**
 * Generate shared noise pattern for splatter edge variation
 * @param {number} seed - Unique seed for this pattern
 * @param {number} points - Number of points in the pattern
 * @returns {number[]} Pre-calculated noise values
 */
function generateNoisePattern(seed, points = 24) {
    const cacheKey = `noise-${seed}-${points}`;
    if (bloodsplatterNoisePatterns.has(cacheKey)) {
        return bloodsplatterNoisePatterns.get(cacheKey);
    }
    
    const pattern = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Dual-wave noise for organic variation
        const wave1 = Math.sin(angle * 2.5 + seed) * 0.7;
        const wave2 = Math.sin(angle * 5.2 + seed * 2) * 0.3;
        pattern.push(wave1 + wave2);
    }
    
    bloodsplatterNoisePatterns.set(cacheKey, pattern);
    return pattern;
}

/**
 * Generate coordinate points for a specific progress value
 * @param {number} progress - Animation progress (0-150)
 * @param {number} centerX - Center X position (%)
 * @param {number} centerY - Center Y position (%)
 * @param {number[]} noisePattern - Pre-calculated noise pattern
 * @returns {number[]} Coordinate array [x1, y1, x2, y2, ...]
 */
function generateOptimizedPoints(progress, centerX, centerY, noisePattern) {
    const points = noisePattern.length;
    const baseRadius = progress;
    const maxVariation = 0.35;
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const progressFactor = Math.min(1, progress / 80);
        const radiusVariation = 1 + (noisePattern[i] * maxVariation * progressFactor);
        const radius = Math.max(5, baseRadius * radiusVariation);
        
        const x = Math.max(0, Math.min(100, centerX + Math.cos(angle) * (radius * 0.9)));
        const y = Math.max(0, Math.min(100, centerY + Math.sin(angle) * (radius * 0.9)));
        
        coordinates.push(x, y);
    }
    
    return coordinates;
}

/**
 * Convert coordinate array to CSS polygon string
 * @param {number[]} coordinates - Coordinate array [x1, y1, x2, y2, ...]
 * @returns {string} CSS polygon path
 */
function coordinatesToCSS(coordinates) {
    let path = 'polygon(';
    for (let i = 0; i < coordinates.length; i += 2) {
        path += `${coordinates[i].toFixed(1)}% ${coordinates[i + 1].toFixed(1)}%`;
        if (i < coordinates.length - 2) path += ', ';
    }
    path += ')';
    return path;
}

// =============================================================================
// PATH PRE-CALCULATION SYSTEM
// =============================================================================

/**
 * Pre-calculate all splatter paths for different progress values
 * @param {number} centerX - Center X position (%)
 * @param {number} centerY - Center Y position (%)
 * @param {number} seed - Unique seed for this splatter
 * @returns {Object} Pre-calculated paths keyed by progress value
 */
function preCalculateSplatterPaths(centerX, centerY, seed) {
    const cacheKey = `${centerX}-${centerY}-${seed}`;
    if (bloodsplatterPathCache.has(cacheKey)) {
        return bloodsplatterPathCache.get(cacheKey);
    }
    
    const noisePattern = generateNoisePattern(seed, 24);
    const paths = {};
    
    // Pre-calculate paths for progress values from 0 to 150 in steps of 6
    for (let progress = 0; progress <= 150; progress += 6) {
        paths[progress] = generateOptimizedPoints(progress, centerX, centerY, noisePattern);
    }
    
    bloodsplatterPathCache.set(cacheKey, paths);
    return paths;
}

/**
 * Get pre-calculated path with linear interpolation for smooth animation
 * @param {number} progress - Animation progress (0-150)
 * @param {number} centerX - Center X position (%)
 * @param {number} centerY - Center Y position (%)
 * @param {number} seed - Unique seed for this splatter
 * @returns {string} CSS polygon path
 */
function getPreCalculatedPath(progress, centerX, centerY, seed) {
    const cacheKey = `${centerX}-${centerY}-${seed}`;
    const paths = bloodsplatterPathCache.get(cacheKey);
    
    if (!paths) {
        // Lazy initialization - only calculate when needed
        preCalculateSplatterPaths(centerX, centerY, seed);
        return getPreCalculatedPath(progress, centerX, centerY, seed);
    }
    
    const adjustedProgress = Math.max(0, Math.min(150, progress));
    const lowerKey = Math.floor(adjustedProgress / 6) * 6;
    const upperKey = Math.min(150, lowerKey + 6);
    
    // Use exact match if available
    if (paths[adjustedProgress]) {
        return coordinatesToCSS(paths[adjustedProgress]);
    }
    
    // Linear interpolation between two nearest points
    if (paths[lowerKey] && paths[upperKey] && lowerKey !== upperKey) {
        const factor = (adjustedProgress - lowerKey) / (upperKey - lowerKey);
        const lowerCoords = paths[lowerKey];
        const upperCoords = paths[upperKey];
        const interpolated = [];
        
        for (let i = 0; i < lowerCoords.length; i++) {
            interpolated[i] = lowerCoords[i] + (upperCoords[i] - lowerCoords[i]) * factor;
        }
        
        return coordinatesToCSS(interpolated);
    }
    
    // Fallback to nearest neighbor
    return coordinatesToCSS(paths[lowerKey] || paths[upperKey] || paths[0]);
}

// =============================================================================
// ANIMATION FRAME PRE-CALCULATION SYSTEM (ZERO REAL-TIME CALCULATIONS)
// =============================================================================

/**
 * Pre-calculate ALL animation frames including pulse effects (NO REAL-TIME CALCULATIONS)
 * @param {number} centerX - Center X position (%)
 * @param {number} centerY - Center Y position (%)
 * @param {number} seed - Unique seed for this splatter
 * @param {number} totalFrames - Total number of frames to pre-calculate
 * @returns {string[]} Array of pre-calculated CSS polygon paths
 */
function preCalculateAnimationFrames(centerX, centerY, seed, totalFrames = 100) {
    const cacheKey = `anim-${centerX}-${centerY}-${seed}`;
    if (bloodsplatterAnimationFrames.has(cacheKey)) {
        return bloodsplatterAnimationFrames.get(cacheKey);
    }
    
    // Ensure base paths are calculated first
    preCalculateSplatterPaths(centerX, centerY, seed);
    
    const frames = [];
    
    // Pre-calculate every frame with pulse effects
    for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / (totalFrames - 1); // 0 to 1
        const maxProgress = 150;
        
        // Pre-calculate pulse effect (no Math.sin during animation)
        const pulse = Math.sin(progress * Math.PI * 1.2) * 2;
        const adjustedProgress = Math.min(maxProgress, Math.max(0, (progress * maxProgress) + pulse));
        
        // Get the pre-calculated CSS string directly
        const cssPath = getPreCalculatedPath(adjustedProgress, centerX, centerY, seed);
        frames.push(cssPath);
    }
    
    bloodsplatterAnimationFrames.set(cacheKey, frames);
    return frames;
}

/**
 * Get animation frame by index (ZERO real-time calculations)
 * @param {number} frameIndex - Frame index (0 to totalFrames-1)
 * @param {number} totalFrames - Total number of frames
 * @param {number} centerX - Center X position (%)
 * @param {number} centerY - Center Y position (%)
 * @param {number} seed - Unique seed for this splatter
 * @returns {string} Pre-calculated CSS polygon path
 */
function getAnimationFrame(frameIndex, totalFrames, centerX, centerY, seed) {
    const animFrames = preCalculateAnimationFrames(centerX, centerY, seed, totalFrames);
    const clampedIndex = Math.max(0, Math.min(totalFrames - 1, Math.round(frameIndex)));
    return animFrames[clampedIndex];
}

// =============================================================================
// ENHANCED MULTI-STAGE ANIMATIONS (ZERO REAL-TIME CALCULATIONS)
// =============================================================================

/**
 * Create enhanced multi-stage splatter reveal with pre-calculated frames
 * @param {HTMLElement} element - The bloodsplatter element
 * @param {Object} config - Configuration object with centerX, centerY, etc.
 * @returns {gsap.timeline} GSAP timeline for the enhanced animation
 */
function createEnhancedSplatterReveal(element, config) {
    const img = element.querySelector('img');
    if (!img) return null;
    
    // Create multi-stage reveal timeline
    const tl = gsap.timeline();
    
    // Get unique seed for enhanced animation
    const enhancedSeed = getSplatterSeed('enhanced-' + Date.now());
    
    // Pre-calculate enhanced animation frames with different progress ranges
    const stage1Frames = 20; // 0-20% progress
    const stage2Frames = 30; // 20-80% progress  
    const stage3Frames = 50; // 80-150% progress with pulse
    
    // Pre-calculate all enhanced frames upfront
    const stage1AnimFrames = [];
    const stage2AnimFrames = [];
    const stage3AnimFrames = [];
    
    // Stage 1: 0-20% progress
    for (let i = 0; i < stage1Frames; i++) {
        const progress = (i / (stage1Frames - 1)) * 20;
        stage1AnimFrames.push(getPreCalculatedPath(progress, config.centerX, config.centerY, enhancedSeed));
    }
    
    // Stage 2: 20-80% progress
    for (let i = 0; i < stage2Frames; i++) {
        const progress = 20 + ((i / (stage2Frames - 1)) * 60);
        stage2AnimFrames.push(getPreCalculatedPath(progress, config.centerX, config.centerY, enhancedSeed));
    }
    
    // Stage 3: 80-150% progress with pre-calculated pulse
    for (let i = 0; i < stage3Frames; i++) {
        const progress = i / (stage3Frames - 1);
        const pulse = Math.sin(progress * Math.PI * 2.5) * 1.5; // Pre-calculate pulse
        const currentProgress = 80 + (progress * 70) + pulse;
        stage3AnimFrames.push(getPreCalculatedPath(currentProgress, config.centerX, config.centerY, enhancedSeed));
    }
    
    // Stage 1: Initial small splatter - ZERO real-time calculations
    tl.to(img, {
        duration: 0.1,
        ease: "power4.out",
        onUpdate: function() {
            const progress = this.progress();
            const frameIndex = Math.round(progress * (stage1Frames - 1));
            img.style.clipPath = stage1AnimFrames[frameIndex];
        }
    })
    // Stage 2: Rapid expansion - ZERO real-time calculations
    .to(img, {
        duration: 0.15,
        ease: "power3.inOut",
        onUpdate: function() {
            const progress = this.progress();
            const frameIndex = Math.round(progress * (stage2Frames - 1));
            img.style.clipPath = stage2AnimFrames[frameIndex];
        }
    })
    // Stage 3: Final fast expansion - ZERO real-time calculations
    .to(img, {
        duration: 0.2,
        ease: "power4.out",
        onUpdate: function() {
            const progress = this.progress();
            const frameIndex = Math.round(progress * (stage3Frames - 1));
            img.style.clipPath = stage3AnimFrames[frameIndex];
        }
    });
    
    return tl;
}

// =============================================================================
// UNIFIED ANIMATION SYSTEM
// =============================================================================

/**
 * Create a standard bloodsplatter reveal animation with ZERO real-time calculations
 * @param {HTMLElement} element - The bloodsplatter element
 * @param {string} splatterType - Type of splatter (e.g., 'bloodsplatter-decoration-left')
 * @param {Object} customConfig - Optional custom configuration
 * @returns {gsap.timeline} GSAP timeline for the animation
 */
function createBloodsplatterAnimation(element, splatterType, customConfig = {}) {
    const img = element.querySelector('img');
    if (!img) return null;
    
    // Get configuration (custom or default)
    const config = { ...SPLATTER_CONFIGS[splatterType], ...customConfig };
    if (!config) {
        console.warn(`No configuration found for splatter type: ${splatterType}`);
        return null;
    }
    
    // Get seed for this splatter type
    const seed = getSplatterSeed(splatterType);
    
    // Create timeline
    const tl = gsap.timeline({ paused: true });
    
    // Set initial state
    const initialPath = getPreCalculatedPath(0, config.centerX, config.centerY, seed);
    gsap.set(img, {
        clipPath: initialPath
    });
    
    // Create the main splatter reveal animation with ZERO real-time calculations
    const totalFrames = 100;
    // Pre-calculate all frames on initialization
    preCalculateAnimationFrames(config.centerX, config.centerY, seed, totalFrames);
    
    tl.to(img, {
        duration: config.duration,
        ease: config.ease,
        onUpdate: function() {
            // ZERO real-time calculations - only lookup
            const progress = this.progress();
            const frameIndex = progress * (totalFrames - 1);
            const cssPath = getAnimationFrame(frameIndex, totalFrames, config.centerX, config.centerY, seed);
            img.style.clipPath = cssPath;
        }
    });
    
    return tl;
}

/**
 * Initialize bloodsplatter animations for a list of elements
 * @param {string[]} splatterSelectors - Array of CSS selectors for splatter elements
 * @param {Object} options - Options for animation triggers
 */
function initBloodsplatterAnimations(splatterSelectors, options = {}) {
    const defaultOptions = {
        triggerStart: "top 95%",
        triggerActions: "play none none none",
        ...options
    };
    
    // Get all bloodsplatter elements
    const bloodsplatterElements = document.querySelectorAll(splatterSelectors.join(', '));
    
    bloodsplatterElements.forEach((element, index) => {
        // Determine the splatter type from class names
        let splatterType = '';
        for (const className of element.classList) {
            if (SPLATTER_CONFIGS[className]) {
                splatterType = className;
                break;
            }
        }
        
        if (!splatterType) {
            console.warn('Could not determine splatter type for element:', element);
            return;
        }
        
        const config = SPLATTER_CONFIGS[splatterType];
        
        // Find the appropriate trigger element
        let triggerElement;
        if (splatterType === 'bloodsplatter-decoration-left') {
            triggerElement = element;
        } else {
            const parentSection = element.closest('section, .showcase-item, .features-container, .gamemode-header, .server-title-container');
            triggerElement = parentSection || element;
        }
        
        // Create animation
        const tl = createBloodsplatterAnimation(element, splatterType);
        if (!tl) return;
        
        // Create ScrollTrigger
        ScrollTrigger.create({
            trigger: triggerElement,
            start: defaultOptions.triggerStart,
            toggleActions: defaultOptions.triggerActions,
            markers: false,
            onEnter: () => {
                gsap.delayedCall(config.delay, () => {
                    tl.play();
                    element.classList.add('bloodsplatter-revealed');
                    
                    // Special handling for specific splatter types
                    if (splatterType === 'bloodsplatter-decoration-left') {
                        const descriptionTitle = document.querySelector('.description-title');
                        const descriptionText = document.querySelector('.description-text');
                        
                        if (descriptionTitle) {
                            gsap.to(descriptionTitle, { 
                                duration: 0.7, 
                                opacity: 1, 
                                y: 0, 
                                ease: 'power3.out',
                                delay: 0.2
                            });
                        }
                        
                        if (descriptionText) {
                            gsap.to(descriptionText, { 
                                duration: 0.8, 
                                opacity: 1, 
                                y: 0, 
                                ease: 'power3.out',
                                delay: 0.4
                            });
                        }
                    }
                });
            },
            id: `bloodsplatter-${splatterType}-${index}`
        });
    });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get unique seed for a splatter type
 * @param {string} splatterType - Type identifier
 * @returns {number} Unique seed value
 */
function getSplatterSeed(splatterType) {
    return SPLATTER_SEEDS[splatterType] || Math.random() * 100;
}

/**
 * Add new splatter configuration
 * @param {string} splatterType - Type identifier
 * @param {Object} config - Configuration object
 * @param {number} seed - Optional custom seed
 */
function addSplatterConfig(splatterType, config, seed = null) {
    SPLATTER_CONFIGS[splatterType] = config;
    if (seed !== null) {
        SPLATTER_SEEDS[splatterType] = seed;
    }
}

/**
 * Clear all caches (useful for memory management)
 */
function clearSplatterCaches() {
    bloodsplatterPathCache.clear();
    bloodsplatterNoisePatterns.clear();
    bloodsplatterAnimationFrames.clear();
}

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

/**
 * DEPRECATED: Old function with real-time calculations
 * @deprecated Use unified animation system instead
 */
function createNoisyRevealPath(progress, centerX, centerY, seed = 0) {
    console.warn('createNoisyRevealPath is deprecated - use unified animation system instead');
    return getPreCalculatedPath(progress, centerX, centerY, seed);
}

/**
 * DEPRECATED: Old irregular splatter function
 * @deprecated Use unified animation system instead
 */
function createIrregularSplatter(baseRadius, irregularity = 0.3) {
    console.warn('createIrregularSplatter is deprecated - use unified animation system instead');
    // Fallback to simple circular path
    return `polygon(50% 50%)`;
}

// =============================================================================
// EXPORT API
// =============================================================================

// Export all functions for external use
window.BloodsplatterAnimations = {
    // Main API functions
    createBloodsplatterAnimation,
    initBloodsplatterAnimations,
    createEnhancedSplatterReveal,
    
    // Configuration functions
    addSplatterConfig,
    getSplatterSeed,
    
    // Pre-calculation functions (ZERO real-time calculations)
    preCalculateAnimationFrames,
    getAnimationFrame,
    preCalculateSplatterPaths,
    getPreCalculatedPath,
    
    // Utility functions
    generateNoisePattern,
    coordinatesToCSS,
    clearSplatterCaches,
    
    // Legacy compatibility (deprecated)
    createNoisyRevealPath,
    createIrregularSplatter,
    
    // Direct access to configurations (read-only recommended)
    SPLATTER_CONFIGS,
    SPLATTER_SEEDS
};
