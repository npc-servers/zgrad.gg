/**
 * Discord Section JavaScript
 * Handles animations and interactions for the Discord section
 */

class DiscordSection {
    constructor() {
        this.section = document.querySelector('.discord-section');
        this.imageContainer = document.querySelector('.discord-image-3d');
        this.title = document.querySelector('.discord-title');
        this.reasons = document.querySelectorAll('.discord-reason');
        this.joinButton = document.querySelector('.discord-join-button');
        
        this.isVisible = false;
        this.animationsTriggered = false;
        
        this.init();
    }
    
    init() {
        if (!this.section) return;
        
        this.setupScrollTrigger();
        this.setupInteractions();
        this.setupAccessibility();
    }
    
    setupScrollTrigger() {
        // Use GSAP ScrollTrigger if available, otherwise use Intersection Observer
        if (typeof gsap !== 'undefined' && gsap.ScrollTrigger) {
            this.setupGSAPAnimations();
        } else {
            this.setupIntersectionObserver();
        }
    }
    
    setupGSAPAnimations() {
        // Set initial states
        gsap.set(this.title, { 
            opacity: 0, 
            y: 50,
            scale: 0.9
        });
        
        gsap.set(this.reasons, { 
            opacity: 0, 
            x: -30,
            stagger: 0.1
        });
        
        gsap.set(this.joinButton, { 
            opacity: 0, 
            y: 30,
            scale: 0.95
        });
        
        gsap.set(this.imageContainer, { 
            opacity: 0, 
            scale: 0.8,
            rotationY: -15
        });
        
        // Create timeline for entrance animations
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.section,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none none",
                onEnter: () => {
                    this.isVisible = true;
                    this.animationsTriggered = true;
                },
                onLeave: () => {
                    this.isVisible = false;
                }
            }
        });
        
        // Animate elements in sequence
        tl.to(this.imageContainer, {
            duration: 1,
            opacity: 1,
            scale: 1,
            rotationY: 0,
            ease: "power3.out"
        })
        .to(this.title, {
            duration: 0.8,
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "power3.out"
        }, "-=0.5")
        .to(this.reasons, {
            duration: 0.6,
            opacity: 1,
            x: 0,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.4")
        .to(this.joinButton, {
            duration: 0.6,
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "back.out(1.7)"
        }, "-=0.2");
        
        // Add continuous floating animation for the image
        gsap.to(this.imageContainer, {
            duration: 6,
            y: -10,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animationsTriggered) {
                    this.triggerEntranceAnimations();
                    this.animationsTriggered = true;
                    this.isVisible = true;
                } else if (!entry.isIntersecting) {
                    this.isVisible = false;
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -10% 0px'
        });
        
        observer.observe(this.section);
    }
    
    triggerEntranceAnimations() {
        // Fallback animations without GSAP
        this.imageContainer.style.transition = 'all 1s cubic-bezier(0.25, 0.8, 0.25, 1)';
        this.title.style.transition = 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) 0.3s';
        this.joinButton.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) 0.8s';
        
        // Trigger animations
        setTimeout(() => {
            this.imageContainer.style.opacity = '1';
            this.imageContainer.style.transform = 'scale(1) rotateY(0deg)';
        }, 100);
        
        setTimeout(() => {
            this.title.style.opacity = '1';
            this.title.style.transform = 'translateY(0) scale(1)';
        }, 400);
        
        this.reasons.forEach((reason, index) => {
            reason.style.transition = `opacity 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) ${0.6 + (index * 0.1)}s, transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) ${0.6 + (index * 0.1)}s`;
            setTimeout(() => {
                reason.style.opacity = '1';
                reason.style.transform = 'translateX(0)';
                // Clear the inline transition after animation completes to allow CSS hover effects
                setTimeout(() => {
                    reason.style.transition = '';
                }, 100);
            }, 600 + (index * 100));
        });
        
        setTimeout(() => {
            this.joinButton.style.opacity = '1';
            this.joinButton.style.transform = 'translateY(0) scale(1)';
        }, 1000);
    }
    
    setupInteractions() {
        // Remove JavaScript hover animations to prevent conflicts with CSS
        // Let CSS handle all hover effects for discord reasons
        
        // Enhanced button interactions
        if (this.joinButton) {
            this.joinButton.addEventListener('mouseenter', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(this.joinButton, {
                        duration: 0.3,
                        scale: 1.05,
                        y: -3,
                        ease: "power2.out"
                    });
                }
            });
            
            this.joinButton.addEventListener('mouseleave', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(this.joinButton, {
                        duration: 0.3,
                        scale: 1,
                        y: 0,
                        ease: "power2.out"
                    });
                }
            });
            
            this.joinButton.addEventListener('click', (e) => {
                // Add click animation
                if (typeof gsap !== 'undefined') {
                    gsap.to(this.joinButton, {
                        duration: 0.1,
                        scale: 0.98,
                        ease: "power2.out",
                        onComplete: () => {
                            gsap.to(this.joinButton, {
                                duration: 0.2,
                                scale: 1.05,
                                ease: "back.out(1.7)"
                            });
                        }
                    });
                }
                
                // Track analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'click', {
                        event_category: 'Discord',
                        event_label: 'Join Discord Button',
                        value: 1
                    });
                }
            });
        }
        
        // 3D image interaction
        if (this.imageContainer) {
            const image = this.imageContainer.querySelector('.discord-image');
            
            this.imageContainer.addEventListener('mousemove', (e) => {
                if (window.innerWidth <= 768) return; // Disable on mobile
                
                const rect = this.imageContainer.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) / rect.width;
                const deltaY = (e.clientY - centerY) / rect.height;
                
                const rotateX = deltaY * -10;
                const rotateY = deltaX * 15;
                
                if (typeof gsap !== 'undefined') {
                    gsap.to(image, {
                        duration: 0.3,
                        rotationX: rotateX,
                        rotationY: rotateY,
                        transformPerspective: 1000,
                        ease: "power2.out"
                    });
                }
            });
            
            this.imageContainer.addEventListener('mouseleave', () => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(image, {
                        duration: 0.5,
                        rotationX: 0,
                        rotationY: 0,
                        ease: "power2.out"
                    });
                }
            });
        }
    }
    
    setupAccessibility() {
        // Add ARIA labels and roles
        if (this.section) {
            this.section.setAttribute('aria-label', 'Join our Discord community');
        }
        
        if (this.joinButton) {
            this.joinButton.setAttribute('aria-describedby', 'discord-reasons');
        }
        
        // Add IDs for screen readers
        const reasonsList = document.querySelector('.discord-reasons');
        if (reasonsList) {
            reasonsList.setAttribute('id', 'discord-reasons');
            reasonsList.setAttribute('role', 'list');
        }
        
        this.reasons.forEach((reason, index) => {
            reason.setAttribute('role', 'listitem');
            reason.setAttribute('tabindex', '0');
            
            // Add keyboard navigation
            reason.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    reason.click();
                }
            });
        });
        
        // Reduce motion for users who prefer it
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disableAnimations();
        }
    }
    
    disableAnimations() {
        // Disable all animations for users who prefer reduced motion
        if (this.imageContainer) {
            this.imageContainer.style.animation = 'none';
        }
        
        // Remove GSAP animations
        if (typeof gsap !== 'undefined') {
            gsap.set([this.title, this.reasons, this.joinButton, this.imageContainer], {
                clearProps: "all"
            });
        }
    }
    
    // Public method to refresh animations (useful for dynamic content)
    refresh() {
        if (typeof gsap !== 'undefined' && gsap.ScrollTrigger) {
            gsap.ScrollTrigger.refresh();
        }
    }
    
    // Public method to destroy the instance
    destroy() {
        if (typeof gsap !== 'undefined' && gsap.ScrollTrigger) {
            gsap.ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.trigger === this.section) {
                    trigger.kill();
                }
            });
        }
    }
}

// Initialize Discord Section when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for GSAP to load if it's being loaded asynchronously
    const initDiscordSection = () => {
        if (document.querySelector('.discord-section')) {
            window.discordSection = new DiscordSection();
        }
    };
    
    // Check if GSAP is already loaded
    if (typeof gsap !== 'undefined') {
        initDiscordSection();
    } else {
        // Wait a bit for GSAP to load, then initialize
        setTimeout(initDiscordSection, 100);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.discordSection && document.hidden) {
        // Pause animations when page is not visible
        if (typeof gsap !== 'undefined') {
            gsap.globalTimeline.pause();
        }
    } else if (window.discordSection && !document.hidden) {
        // Resume animations when page becomes visible
        if (typeof gsap !== 'undefined') {
            gsap.globalTimeline.resume();
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordSection;
}
