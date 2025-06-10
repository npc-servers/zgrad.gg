// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize showcase animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initShowcaseAnimations();
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
                end: "bottom 15%",
                toggleActions: "play none none reverse",
                id: `showcase-${index + 1}`, // Give each trigger a unique ID
                onEnter: () => {
                    item.classList.add('in-view');
                },
                onLeave: () => {
                    item.classList.remove('in-view');
                },
                onEnterBack: () => {
                    item.classList.add('in-view');
                },
                onLeaveBack: () => {
                    item.classList.remove('in-view');
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
        
        // Add subtle parallax effect for alternating items
        if (index % 2 === 1) {
            gsap.to(showcaseVideo, {
                y: -30,
                scrollTrigger: {
                    trigger: item,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                    id: `parallax-video-${index + 1}`
                }
            });
        } else {
            gsap.to(showcaseText, {
                y: -20,
                scrollTrigger: {
                    trigger: item,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                    id: `parallax-text-${index + 1}`
                }
            });
        }
    });
    
    // Animate features title container
    const featuresTitleContainer = document.querySelector('.features-title-container');
    if (featuresTitleContainer) {
        const featuresTitle = featuresTitleContainer.querySelector('.features-title');
        
        // Set initial state only for title (let bloodsplatter display normally)
        gsap.set(featuresTitle, {
            opacity: 0,
            y: 50,
            scale: 0.9
        });
        
        // Animate only the title
        gsap.to(featuresTitle, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "power3.out",
            scrollTrigger: {
                trigger: featuresTitleContainer,
                start: "top 95%",
                toggleActions: "play none none reverse",
                id: "features-title-container"
            }
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
                toggleActions: "play none none reverse",
                id: "features-list"
            }
        });
    }
    
    // Hover animations are handled by CSS
}

// Refresh ScrollTrigger on window resize
window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
}); 