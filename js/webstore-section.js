// Webstore Section JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize webstore section animations
    initWebstoreAnimations();
    
    // Initialize webstore gradient background
    initWebstoreGradient();
});

function initWebstoreAnimations() {
    // Register ScrollTrigger animations for webstore section
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
        gsap.registerPlugin(ScrollTrigger);

        // Animate bloody line decoration (only once)
        gsap.fromTo('.bloodsplatter-decoration-webstore-top', 
            {
                opacity: 0,
                y: -30
            },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.webstore-section',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        gsap.fromTo('.bloodsplatter-decoration-webstore-top img', 
            {
                opacity: 0,
                y: -20
            },
            {
                opacity: 0.7,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.webstore-section',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate dollar splatter background (only once)
        gsap.fromTo('.dollar-splatter-background', 
            {
                opacity: 0,
                scale: 0.8,
                rotation: -25
            },
            {
                opacity: 0.08,
                scale: 1,
                rotation: -15,
                duration: 1.2,
                delay: 0.3,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.webstore-section',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate webstore header text (only once)

        gsap.fromTo('.webstore-large', 
            {
                opacity: 0,
                y: 50,
                scale: 0.9
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1,
                delay: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.webstore-section',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        gsap.fromTo('.webstore-description', 
            {
                opacity: 0,
                y: 30
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: 0.4,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.webstore-section',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate webstore character image (only on desktop)
        if (window.innerWidth > 992) {
            gsap.fromTo('.webstore-character', 
                {
                    opacity: 0,
                    x: 50,
                    scale: 0.8
                },
                {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    duration: 1,
                    delay: 0.6,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: '.webstore-content',
                        start: 'top 85%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }

        // Animate webstore image caption (only on desktop)
        if (window.innerWidth > 992) {
            gsap.fromTo('.webstore-image-caption', 
                {
                    opacity: 0,
                    y: 20
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    delay: 1.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: '.webstore-content',
                        start: 'top 85%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }

        // Animate features title
        gsap.fromTo('.webstore-features-title', 
            {
                opacity: 0,
                x: -50
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                delay: 0.3,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.webstore-features',
                    start: 'top 85%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate webstore perks with stagger and button together
        const perksTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.webstore-perks-list',
                start: 'top 85%',
                end: 'bottom 20%',
                toggleActions: 'play none none none'
            }
        });

        perksTimeline.fromTo('.webstore-perk', 
            {
                opacity: 0,
                x: -50,
                scale: 0.9
            },
            {
                opacity: 1,
                x: 0,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                delay: 0.5,
                ease: "power3.out"
            }
        ).fromTo('.webstore-visit-button', 
            {
                opacity: 0,
                y: 30,
                scale: 0.9
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                ease: "power3.out"
            }, "-=0.2"
        );

        // Add parallax effect to webstore character
        gsap.to('.webstore-character', {
            y: -20,
            ease: "none",
            scrollTrigger: {
                trigger: '.webstore-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });

        // Animate blood splatter decoration (only once)
        gsap.fromTo('.bloodsplatter-decoration-webstore img', 
            {
                clipPath: 'circle(0% at 50% 50%)',
                filter: 'brightness(0.5) contrast(1.2)'
            },
            {
                clipPath: 'circle(100% at 50% 50%)',
                filter: 'brightness(1) contrast(1)',
                duration: 2,
                delay: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '.webstore-header',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Enhanced hover effects for webstore perks
        const webstorePerks = document.querySelectorAll('.webstore-perk');
        webstorePerks.forEach(perk => {
            const icon = perk.querySelector('.perk-icon');
            const title = perk.querySelector('.perk-title');
            const description = perk.querySelector('.perk-description');

            perk.addEventListener('mouseenter', () => {
                gsap.to(icon, {
                    scale: 1.1,
                    rotation: 5,
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap.to(title, {
                    color: '#e78f3c',
                    duration: 0.3,
                    ease: "power2.out"
                });
                // Removed rightward movement animation for description
            });

            perk.addEventListener('mouseleave', () => {
                gsap.to(icon, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap.to(title, {
                    color: 'var(--text-color)',
                    duration: 0.3,
                    ease: "power2.out"
                });
                // Removed rightward movement animation for description
            });
        });

        // Enhanced hover effects for webstore button
        const webstoreButton = document.querySelector('.webstore-visit-button');
        if (webstoreButton) {
            webstoreButton.addEventListener('mouseenter', () => {
                gsap.to(webstoreButton.querySelector('svg'), {
                    x: 5,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            webstoreButton.addEventListener('mouseleave', () => {
                gsap.to(webstoreButton.querySelector('svg'), {
                    x: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        }

        // Add 3D mouse tracking for webstore image
        initWebstore3DTracking();
        
        // Initialize automatic benefit cycling
        initWebstoreCycling();
    }
}

function initWebstore3DTracking() {
    const webstoreCharacter = document.querySelector('.webstore-character');
    const webstoreImage = document.querySelector('.webstore-image');
    
    if (!webstoreCharacter || !webstoreImage) return;
    
    // Disable 3D tracking on mobile devices
    if (window.innerWidth <= 768) return;
    
    webstoreCharacter.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 768) return; // Disable on mobile
        
        const rect = webstoreCharacter.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) / rect.width;
        const deltaY = (e.clientY - centerY) / rect.height;
        
        const rotateX = deltaY * -10;
        const rotateY = deltaX * 15;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(webstoreImage, {
                duration: 0.6,
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1000,
                ease: "power2.out"
            });
        }
    });
    
    webstoreCharacter.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
            gsap.to(webstoreImage, {
                duration: 0.8,
                rotationX: 0,
                rotationY: 0,
                ease: "power2.out"
            });
        }
    });
}

function initWebstoreGradient() {
    // Animate gradient background on scroll (only once)
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
        gsap.registerPlugin(ScrollTrigger);
        
        const gradientBg = document.querySelector('.webstore-gradient-bg');
        if (gradientBg) {
            gsap.to(gradientBg, {
                opacity: 1,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '.webstore-section',
                    start: 'top 60%',
                    end: 'bottom 40%',
                    toggleActions: 'play none none none'
                }
            });
        }
    }
}

// Add click tracking for analytics
document.addEventListener('DOMContentLoaded', () => {
    const webstoreButton = document.querySelector('.webstore-visit-button');
    if (webstoreButton) {
        webstoreButton.addEventListener('click', function(e) {
            // Add analytics tracking here if needed
            console.log('Webstore button clicked');
        });
    }
});

// Intersection Observer for performance optimization
const observerOptions = {
    threshold: 0.1,
    rootMargin: '50px'
};

const webstoreObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

// Observe webstore elements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const webstoreElements = document.querySelectorAll('.webstore-perk, .webstore-character');
    webstoreElements.forEach(el => webstoreObserver.observe(el));
});

// Utility function to check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Add smooth scroll behavior for internal webstore links
document.addEventListener('click', function(e) {
    if (e.target.matches('.webstore-scroll-link')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

function initWebstoreCycling() {
    const perks = document.querySelectorAll('.webstore-perk');
    const webstoreImage = document.getElementById('webstore-image');
    const webstoreCaption = document.getElementById('webstore-caption');
    
    if (!perks.length || !webstoreImage || !webstoreCaption) return;
    
    // Define content for each perk
    const perkData = [
        {
            image: 'images/fittr.png',
            alt: 'Exclusive Weapons',
            caption: 'Exclusive weapons - Access to unique weapons and equipment not available to regular players'
        },
        {
            image: 'images/fittr.png', // You can replace with different images
            alt: 'Character Customizations',
            caption: 'Customizations - Unlock unique character skins, models, and cosmetic items'
        },
        {
            image: 'images/fittr.png', // You can replace with different images
            alt: 'VIP Access',
            caption: 'VIP Access - Priority queue access and exclusive VIP server privileges'
        },
        {
            image: 'images/fittr.png', // You can replace with different images
            alt: 'Support Development',
            caption: 'Support Development - Help fund server hosting and new feature development'
        }
    ];
    
    let currentIndex = 0;
    let cyclingInterval;
    let isPaused = false;
    let resumeTimeout;
    
    function updateContent(index) {
        // Reset all perks to default state
        perks.forEach((perk, i) => {
            perk.classList.remove('active');
            
            // Reset GSAP animations to default state
            if (typeof gsap !== 'undefined') {
                const icon = perk.querySelector('.perk-icon');
                const title = perk.querySelector('.perk-title');
                const description = perk.querySelector('.perk-description');
                
                gsap.to(icon, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap.to(title, {
                    color: 'var(--text-color)',
                    duration: 0.3,
                    ease: "power2.out"
                });
                // Removed rightward movement animation for description
            }
        });
        
        // Add active class and animations to current perk
        if (perks[index]) {
            perks[index].classList.add('active');
            
            // Apply hover-style animations to active perk
            if (typeof gsap !== 'undefined') {
                const icon = perks[index].querySelector('.perk-icon');
                const title = perks[index].querySelector('.perk-title');
                const description = perks[index].querySelector('.perk-description');
                
                gsap.to(icon, {
                    scale: 1.1,
                    rotation: 5,
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap.to(title, {
                    color: '#e78f3c',
                    duration: 0.3,
                    ease: "power2.out"
                });
                // Removed rightward movement animation for description
            }
        }
        
        // Update image and caption with smooth transition
        if (typeof gsap !== 'undefined') {
            gsap.to([webstoreImage, webstoreCaption], {
                opacity: 0,
                duration: 0.3,
                ease: "power2.out",
                onComplete: () => {
                    webstoreImage.src = perkData[index].image;
                    webstoreImage.alt = perkData[index].alt;
                    webstoreCaption.textContent = perkData[index].caption;
                    
                    gsap.to([webstoreImage, webstoreCaption], {
                        opacity: 1,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
        } else {
            webstoreImage.src = perkData[index].image;
            webstoreImage.alt = perkData[index].alt;
            webstoreCaption.textContent = perkData[index].caption;
        }
    }
    
    function startCycling() {
        stopCycling(); // Always clear existing interval first
        
        if (isPaused) return;
        
        cyclingInterval = setInterval(() => {
            if (!isPaused) {
                currentIndex = (currentIndex + 1) % perks.length;
                updateContent(currentIndex);
            }
        }, 3000);
    }
    
    function stopCycling() {
        if (cyclingInterval) {
            clearInterval(cyclingInterval);
            cyclingInterval = null;
        }
        if (resumeTimeout) {
            clearTimeout(resumeTimeout);
            resumeTimeout = null;
        }
    }
    
    function pauseCycling() {
        isPaused = true;
        stopCycling();
    }
    
    function resumeCycling() {
        if (resumeTimeout) {
            clearTimeout(resumeTimeout);
        }
        
        resumeTimeout = setTimeout(() => {
            isPaused = false;
            startCycling();
            resumeTimeout = null;
        }, 1000);
    }
    
    // Initialize first perk as active
    updateContent(0);
    
    // Start cycling after a delay
    setTimeout(() => {
        startCycling();
    }, 2000);
    
    // Pause cycling when hovering over any perk
    perks.forEach((perk, index) => {
        perk.addEventListener('mouseenter', () => {
            pauseCycling();
            currentIndex = index;
            updateContent(currentIndex);
        });
        
        perk.addEventListener('mouseleave', () => {
            resumeCycling();
        });
    });
    
    // Pause cycling when hovering over image area
    const imageContainer = document.querySelector('.webstore-image-container');
    if (imageContainer) {
        imageContainer.addEventListener('mouseenter', pauseCycling);
        imageContainer.addEventListener('mouseleave', resumeCycling);
    }
    
    // Pause when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseCycling();
        } else {
            resumeCycling();
        }
    });
}

// Export functions for external use if needed
window.WebstoreSection = {
    initWebstoreAnimations,
    initWebstoreGradient,
    initWebstoreCycling,
    isElementInViewport
};