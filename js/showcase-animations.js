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

// Bloodsplatter Reveal Animation System - Now using unified system
function initBloodsplatterAnimations() {
    // Use unified bloodsplatter animation system
    if (typeof window.BloodsplatterAnimations !== 'undefined') {
        const splatterSelectors = [
            '.bloodsplatter-decoration-left',
            '.bloodsplatter-decoration-right',
            '.bloodsplatter-decoration-ragdoll',
            '.bloodsplatter-decoration-medical',
            '.bloodsplatter-decoration-gore',
            '.bloodsplatter-decoration-cw',
            '.bloodsplatter-decoration-classes',
            '.bloodsplatter-decoration-header-center'
        ];
        
        window.BloodsplatterAnimations.initBloodsplatterAnimations(splatterSelectors, {
            triggerStart: "top 95%",
            triggerActions: "play none none none"
        });
    } else {
        console.error('BloodsplatterAnimations not loaded! Make sure bloodsplatter-animations.js is included.');
    }
}

// =============================================================================
// BLOODSPLATTER SYSTEM REMOVED - NOW USING UNIFIED SYSTEM
// =============================================================================
// All bloodsplatter-related functions have been moved to bloodsplatter-animations.js
// The unified system provides ZERO real-time calculations and better performance.

// Debounced refresh ScrollTrigger on window resize for better performance
let scrollTriggerResizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(scrollTriggerResizeTimeout);
    scrollTriggerResizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 200); // Debounce ScrollTrigger refresh by 200ms
});

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
    gsap.set([homigradSmall, homigradLarge, playerCount, featuresTitle], {
        opacity: 0,
        y: 30
    });

    // Set initial states for description elements (will be animated with bloodsplatter)
    gsap.set([descriptionTitle, descriptionText], {
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
                // Use a single timeline for better performance instead of individual tweens
                const homigradAnimationTl = gsap.timeline();
                homigradAnimationTl
                    .to(homigradSmall, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' })
                    .to(playerCount, { duration: 0.6, opacity: 1, y: 0, ease: 'power3.out' }, "-=0.4")
                    .to(homigradLarge, { duration: 0.8, opacity: 1, y: 0, ease: 'power3.out' }, "-=0.3");
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
    // Main animation functions
    initShowcase: initShowcaseAnimations,
    initBloodsplatter: initBloodsplatterAnimations,
    initReveals: initAllRevealAnimations
    // Note: All bloodsplatter-related functions are now in bloodsplatter-animations.js
}; 