// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize all animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initShowcaseAnimations();
    initBloodsplatterAnimations();
    initAllRevealAnimations();
});

function initShowcaseAnimations() {
    // Get all showcase items
    const showcaseItems = document.querySelectorAll('.showcase-item');
    
    // Animate each showcase item as it comes into view
    showcaseItems.forEach((item, index) => {
        // Get child elements for more detailed animations
        const showcaseText = item.querySelector('.showcase-text');
        const showcaseVideo = item.querySelector('.showcase-video');
        const showcaseTitle = item.querySelector('.showcase-title');
        const showcaseDescription = item.querySelector('.showcase-description');
        
        // Create timeline for this showcase item
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: item,
                start: "top 95%",
                toggleActions: "play none none none",
                id: `showcase-${index + 1}`, // Give each trigger a unique ID
                onEnter: () => {
                    item.classList.add('in-view');
                }
            }
        });
        
        // Set initial states
        gsap.set([showcaseTitle, showcaseDescription], {
            opacity: 0,
            y: 40
        });
        
        gsap.set(showcaseVideo, {
            opacity: 0,
            scale: 0.8,
            rotationY: 15
        });
        
        // Animate the main container
        tl.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out"
        })
        // Animate text elements with stagger
        .to([showcaseTitle, showcaseDescription], {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out"
        }, "-=0.2")
        // Animate video container
        .to(showcaseVideo, {
            opacity: 1,
            scale: 1,
            rotationY: 0,
            duration: 0.4,
            ease: "back.out(1.7)"
        }, "-=0.3");
        
        // Add hover effects for title scaling
        const showcaseItemElement = item;
        const titleElement = showcaseTitle;
        
        // Set transform origin based on showcase item position (even items are right-aligned)
        const isEvenItem = (index + 1) % 2 === 0;
        const transformOrigin = isEvenItem ? "right center" : "left center";
        
        gsap.set(titleElement, {
            transformOrigin: transformOrigin
        });
        
        // Mouse enter event
        showcaseItemElement.addEventListener('mouseenter', () => {
            gsap.to(titleElement, {
                scale: 1.08,
                duration: 0.4,
                ease: "power3.out"
            });
        });
        
        // Mouse leave event
        showcaseItemElement.addEventListener('mouseleave', () => {
            gsap.to(titleElement, {
                scale: 1,
                duration: 0.4,
                ease: "power3.out"
            });
        });
    });
    
    // Features title container animation removed per user request
    const featuresTitleContainer = document.querySelector('.features-title-container');
    if (featuresTitleContainer) {
        const featuresTitle = featuresTitleContainer.querySelector('.features-title');
        
        // Ensure title is visible without animation
        gsap.set(featuresTitle, {
            opacity: 1,
            y: 0,
            scale: 1
        });
    }
    
    // Animate features list (scrolling features)
    const featuresList = document.querySelector('.features-list');
    if (featuresList) {
        // Set initial transform without affecting opacity to preserve backdrop-filter
        gsap.set(featuresList, {
            x: -100,
            opacity: 1 // Keep opacity at 1 to maintain backdrop-filter
        });
        
        gsap.to(featuresList, {
            x: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: featuresList,
                start: "top 95%",
                toggleActions: "play none none none",
                id: "features-list"
            }
        });
        
        // Add hover effects to feature items
        const featureItems = featuresList.querySelectorAll('.feature-item');
        featureItems.forEach((featureItem) => {
            // Set transform origin to center for uniform scaling
            gsap.set(featureItem, {
                transformOrigin: "center center"
            });
            
            // Mouse enter event
            featureItem.addEventListener('mouseenter', () => {
                gsap.to(featureItem, {
                    scale: 1.05,
                    duration: 0.08,
                    ease: "none"
                });
            });
            
            // Mouse leave event
            featureItem.addEventListener('mouseleave', () => {
                gsap.to(featureItem, {
                    scale: 1,
                    duration: 0.08,
                    ease: "none"
                });
            });
        });
    }
    
    // Hover animations are handled by CSS
}

// Bloodsplatter Reveal Animation System
function initBloodsplatterAnimations() {
    // Configuration for different splatter types with noise-based reveals
    const splatterConfigs = {
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
        }
    };

    // Get all bloodsplatter decorations
    const bloodsplatterElements = document.querySelectorAll([
        '.bloodsplatter-decoration-left',
        '.bloodsplatter-decoration-right',
        '.bloodsplatter-decoration-ragdoll',
        '.bloodsplatter-decoration-medical',
        '.bloodsplatter-decoration-gore',
        '.bloodsplatter-decoration-cw',
        '.bloodsplatter-decoration-classes'
    ].join(', '));

    bloodsplatterElements.forEach((element, index) => {
        const img = element.querySelector('img');
        if (!img) return;

        // Determine the splatter type from class names
        let splatterType = '';
        for (const className of element.classList) {
            if (className.startsWith('bloodsplatter-decoration-')) {
                splatterType = className;
                break;
            }
        }

        const config = splatterConfigs[splatterType];
        if (!config) return;

        // Find the appropriate trigger element
        let triggerElement;
        if (splatterType === 'bloodsplatter-decoration-left') {
            // Use the element itself for left bloodsplatter to trigger at its position
            triggerElement = element;
        } else {
            // Use parent section for other bloodsplatters
            const parentSection = element.closest('section, .showcase-item, .features-container');
            triggerElement = parentSection || element;
        }

        // Create the reveal animation timeline
        const tl = gsap.timeline({
            paused: true
        });

        // Get unique seed for this splatter type
        const seed = getSplatterSeed(splatterType);
        
        // Paths will be lazily calculated when animation starts
        
        // Initial state - completely hidden with noise pattern
        const initialPath = getPreCalculatedPath(0, config.centerX, config.centerY, seed);
        gsap.set(img, {
            clipPath: initialPath
        });

        // Create the main splatter reveal animation with pre-calculated paths
        tl.to(img, {
            duration: config.duration,
            ease: config.ease,
            onUpdate: function() {
                // Use pre-calculated paths for much better performance
                const progress = this.progress();
                const maxProgress = 150; // Go well beyond 100% to ensure full PNG reveal
                
                // Add subtle pulsing to make it more dynamic, but less extreme
                const pulse = Math.sin(progress * Math.PI * 1.2) * 2;
                const adjustedProgress = Math.min(maxProgress, Math.max(0, (progress * maxProgress) + pulse));
                
                // Use pre-calculated path lookup instead of real-time generation
                const noisyPath = getPreCalculatedPath(adjustedProgress, config.centerX, config.centerY, seed);
                img.style.clipPath = noisyPath;
            }
        })
        // Animation complete - just the reveal
        ;

        // Create ScrollTrigger for this splatter
        ScrollTrigger.create({
            trigger: triggerElement,
            start: "top 95%",
            markers: false,
            onEnter: () => {
                // Add delay and play animation
                gsap.delayedCall(config.delay, () => {
                    tl.play();
                    element.classList.add('bloodsplatter-revealed');
                });
            },
            id: `bloodsplatter-${splatterType}-${index}`
        });
    });
}

// Advanced noise-based splatter edge generator with smooth curves
function createNoisyRevealPath(progress, centerX, centerY, seed = 0) {
    const points = 48; // Many more points for much smoother curves
    const baseRadius = progress;
    const maxVariation = 0.35; // Reduced chaos for smoother edges
    let path = 'polygon(';
    
    // Improved noise function with multiple octaves for smoother variation
    function smoothNoise(x, offset = 0) {
        // Primary wave (large features)
        const wave1 = Math.sin(x * 2.5 + offset + seed) * 0.6;
        // Secondary wave (medium features)  
        const wave2 = Math.sin(x * 5.2 + offset * 1.7 + seed * 2) * 0.3;
        // Tertiary wave (fine details)
        const wave3 = Math.sin(x * 8.1 + offset * 2.3 + seed * 3) * 0.1;
        
        return wave1 + wave2 + wave3;
    }
    
    // Generate smooth points with interpolation
    const rawPoints = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // Generate smooth noise-based radius variation
        const noiseValue = smoothNoise(i * 0.4, angle);
        
        // Progressive variation - less chaos at small sizes, more at larger
        const progressFactor = Math.min(1, progress / 80);
        const radiusVariation = 1 + (noiseValue * maxVariation * progressFactor);
        const radius = Math.max(5, baseRadius * radiusVariation); // Minimum radius to avoid sharp cuts
        
        // Calculate point position with better scaling
        const x = centerX + Math.cos(angle) * (radius * 0.9); // Less aggressive scaling
        const y = centerY + Math.sin(angle) * (radius * 0.9);
        
        rawPoints.push({ x, y });
    }
    
    // Smooth the points using simple averaging
    const smoothedPoints = [];
    for (let i = 0; i < rawPoints.length; i++) {
        const prev = rawPoints[(i - 1 + rawPoints.length) % rawPoints.length];
        const curr = rawPoints[i];
        const next = rawPoints[(i + 1) % rawPoints.length];
        
        // Simple smoothing - average with neighbors
        const smoothX = (prev.x * 0.15 + curr.x * 0.7 + next.x * 0.15);
        const smoothY = (prev.y * 0.15 + curr.y * 0.7 + next.y * 0.15);
        
        // Clamp to safe bounds with some overflow allowance
        const clampedX = Math.max(-10, Math.min(110, smoothX));
        const clampedY = Math.max(-10, Math.min(110, smoothY));
        
        smoothedPoints.push({ x: clampedX, y: clampedY });
    }
    
    // Build the polygon path
    for (let i = 0; i < smoothedPoints.length; i++) {
        const point = smoothedPoints[i];
        path += `${point.x}% ${point.y}%`;
        if (i < smoothedPoints.length - 1) path += ', ';
    }
    
    path += ')';
    return path;
}

// Generate unique seeds for each splatter type for variety
function getSplatterSeed(splatterType) {
    const seeds = {
        'bloodsplatter-decoration-left': 12.34,
        'bloodsplatter-decoration-right': 56.78,
        'bloodsplatter-decoration-ragdoll': 91.23,
        'bloodsplatter-decoration-medical': 45.67,
        'bloodsplatter-decoration-gore': 89.01,
        'bloodsplatter-decoration-cw': 23.45,
        'bloodsplatter-decoration-classes': 67.89
    };
    return seeds[splatterType] || Math.random() * 100;
}

// Utility function to create irregular splatter shapes (keeping for compatibility)
function createIrregularSplatter(baseRadius, irregularity = 0.3) {
    const points = 20; // More points for better noise
    let path = 'polygon(';
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radiusVariation = 1 + (Math.random() - 0.5) * irregularity;
        const radius = baseRadius * radiusVariation;
        
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        
        path += `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
        if (i < points - 1) path += ', ';
    }
    
    path += ')';
    return path;
}

// Enhanced splatter reveal for special showcase items
function enhancedSplatterReveal(element, config) {
    const img = element.querySelector('img');
    if (!img) return;
    
    // Create fast multi-stage reveal
    const tl = gsap.timeline();
    
    // Get seed for enhanced animation
    const enhancedSeed = getSplatterSeed('enhanced-' + Date.now());
    
    // Paths will be lazily calculated when animation starts
    
    // Stage 1: Initial small splatter
    tl.to(img, {
        duration: 0.1,
        ease: "power4.out",
        onUpdate: function() {
            const progress = this.progress() * 20;
            if (config.centerX !== undefined && config.centerY !== undefined) {
                const noisyPath = getPreCalculatedPath(progress, config.centerX, config.centerY, enhancedSeed);
                img.style.clipPath = noisyPath;
            }
        }
    })
    // Stage 2: Rapid expansion
    .to(img, {
        duration: 0.15,
        ease: "power3.inOut",
        onUpdate: function() {
            const progress = 20 + (this.progress() * 60); // From 20% to 80%
            if (config.centerX !== undefined && config.centerY !== undefined) {
                const noisyPath = getPreCalculatedPath(progress, config.centerX, config.centerY, enhancedSeed);
                img.style.clipPath = noisyPath;
            }
        }
    })
    // Stage 3: Final fast expansion
    .to(img, {
        duration: 0.2,
        ease: "power4.out",
        onUpdate: function() {
            // Add subtle organic variation with smooth noise
            const progress = this.progress();
            const pulse = Math.sin(progress * Math.PI * 2.5) * 1.5;
            const currentProgress = 80 + (progress * 70) + pulse; // Go to 150% like main animation
            
            // Use pre-calculated paths instead of real-time generation
            if (config.centerX !== undefined && config.centerY !== undefined) {
                const noisyPath = getPreCalculatedPath(currentProgress, config.centerX, config.centerY, enhancedSeed);
                img.style.clipPath = noisyPath;
            }
        }
    });
    
    return tl;
}

// Debounced refresh ScrollTrigger on window resize for better performance
let scrollTriggerResizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(scrollTriggerResizeTimeout);
    scrollTriggerResizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 200); // Debounce ScrollTrigger refresh by 200ms
});

// Ultra-optimized path cache with compressed storage
const pathCache = new Map();
const sharedNoisePatterns = new Map();

// Generate shared noise pattern (reusable base pattern)
function generateSharedNoisePattern(seed, points = 24) {
    const cacheKey = `noise-${seed}-${points}`;
    if (sharedNoisePatterns.has(cacheKey)) {
        return sharedNoisePatterns.get(cacheKey);
    }
    
    const pattern = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Simplified dual-wave noise for better performance
        const wave1 = Math.sin(angle * 2.5 + seed) * 0.7;
        const wave2 = Math.sin(angle * 5.2 + seed * 2) * 0.3;
        pattern.push(wave1 + wave2);
    }
    
    sharedNoisePatterns.set(cacheKey, pattern);
    return pattern;
}

// Generate optimized coordinate points (stored as arrays, not CSS strings)
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

// Convert coordinate array to CSS polygon string (only when needed)
function coordinatesToCSS(coordinates) {
    let path = 'polygon(';
    for (let i = 0; i < coordinates.length; i += 2) {
        path += `${coordinates[i].toFixed(1)}% ${coordinates[i + 1].toFixed(1)}%`;
        if (i < coordinates.length - 2) path += ', ';
    }
    path += ')';
    return path;
}

// Ultra-optimized pre-calculation with compressed storage
function preCalculateSplatterPaths(centerX, centerY, seed) {
    const cacheKey = `${centerX}-${centerY}-${seed}`;
    if (pathCache.has(cacheKey)) {
        return pathCache.get(cacheKey);
    }
    
    const noisePattern = generateSharedNoisePattern(seed, 24); // 50% fewer points
    const paths = {};
    
    // Pre-calculate paths for progress values from 0 to 150 in steps of 6 (50% fewer calculations)
    for (let progress = 0; progress <= 150; progress += 6) {
        paths[progress] = generateOptimizedPoints(progress, centerX, centerY, noisePattern);
    }
    
    pathCache.set(cacheKey, paths);
    return paths;
}

// Get pre-calculated path with linear interpolation for ultra-smooth animation
function getPreCalculatedPath(progress, centerX, centerY, seed) {
    const cacheKey = `${centerX}-${centerY}-${seed}`;
    const paths = pathCache.get(cacheKey);
    
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
    
    // Linear interpolation between two nearest points for smoother animation
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

// Title and Content Reveal Animation System
function initTitleRevealAnimations() {
    // Animate homigrad section titles and content
    const homigradSmall = document.querySelector('.homigrad-small');
    const homigradLarge = document.querySelector('.homigrad-large');
    const playerCount = document.querySelector('.player-count');
    const descriptionTitle = document.querySelector('.description-title');
    const descriptionText = document.querySelector('.description-text');
    const featuresTitle = document.querySelector('.features-title');
    const featuresList = document.querySelector('.features-list');

    // Set initial states
    gsap.set([homigradSmall, homigradLarge, playerCount, descriptionTitle, descriptionText, featuresTitle], {
        opacity: 0,
        y: 30
    });

    // Create timeline for homigrad section
    const homigradTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.homigrad-section',
            start: 'top 95%',
            markers: false,
            onEnter: () => {
                // Animate homigrad elements sequentially
                gsap.to(homigradSmall, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' });
                gsap.to(homigradLarge, { duration: 0.8, opacity: 1, y: 0, ease: 'power3.out', delay: 0.3 });
                gsap.to(playerCount, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out', delay: 0.2 });
                gsap.to(descriptionTitle, { duration: 0.7, opacity: 1, y: 0, ease: 'power3.out', delay: 0.4 });
                gsap.to(descriptionText, { duration: 0.8, opacity: 1, y: 0, ease: 'power3.out', delay: 0.6 });
            }
        }
    });



    // Animate features title
    const featuresTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.features-container',
            start: 'top 95%',
            markers: false,
            onEnter: () => {
                gsap.to(featuresTitle, { 
                    duration: 0.8, 
                    opacity: 1, 
                    y: 0, 
                    ease: 'power3.out' 
                });
            }
        }
    });

    // Animate scrolling features list
    if (featuresList) {
        const featureItems = featuresList.querySelectorAll('.feature-item');
        
        // Set initial state for feature items
        gsap.set(featureItems, {
            opacity: 0,
            y: 20,
            scale: 0.95
        });

        // Create staggered animation for feature items
        const featuresListTl = gsap.timeline({
            scrollTrigger: {
                trigger: featuresList,
                start: 'top 95%',
                markers: false,
                onEnter: () => {
                    gsap.to(featureItems, {
                        duration: 0.6,
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        ease: 'power3.out',
                        stagger: 0.1
                    });
                }
            }
        });
    }
}



// Initialize all reveal animations
function initAllRevealAnimations() {
    initTitleRevealAnimations();
}

// Export functions for external use
window.ShowcaseAnimations = {
    initShowcase: initShowcaseAnimations,
    initBloodsplatter: initBloodsplatterAnimations,
    initReveals: initAllRevealAnimations,
    createIrregularSplatter: createIrregularSplatter,
    createNoisyRevealPath: createNoisyRevealPath,
    getSplatterSeed: getSplatterSeed,
    enhancedSplatterReveal: enhancedSplatterReveal,
    preCalculateSplatterPaths: preCalculateSplatterPaths,
    getPreCalculatedPath: getPreCalculatedPath,
    generateSharedNoisePattern: generateSharedNoisePattern,
    coordinatesToCSS: coordinatesToCSS
}; 