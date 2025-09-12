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
        // Always use Intersection Observer for entrance animations (no GSAP)
        this.setupIntersectionObserver();
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
        // Simple CSS-based entrance animation
        this.section.classList.add('animated');
    }
    
    
    setupInteractions() {
        // Remove JavaScript hover animations to prevent conflicts with CSS
        // Let CSS handle all hover effects for discord reasons
        
        // Standard button interactions (matching site-wide button behavior)
        if (this.joinButton) {
            this.joinButton.addEventListener('click', (e) => {
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
    }
    
    // Public method to refresh animations (useful for dynamic content)
    refresh() {
        // No GSAP ScrollTrigger to refresh - using Intersection Observer
    }
    
    // Public method to destroy the instance
    destroy() {
        // No GSAP ScrollTrigger to destroy - using Intersection Observer
    }
}

// Initialize Discord Section when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.discord-section')) {
        window.discordSection = new DiscordSection();
    }
});


// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordSection;
}
