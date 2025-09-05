// Simple Gamemode Section using Swiper.js
class GamemodeSection {
    constructor() {
        this.swiper = null;
        this.init();
    }

    init() {
        // Wait for Swiper to be available
        if (typeof Swiper === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.initSwiper();
        this.setupScrollAnimations();
    }

    initSwiper() {
        this.swiper = new Swiper('.gamemode-swiper', {
            // Basic settings
            loop: true,
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            
            // Auto-rotation based on docs
            autoplay: {
                delay: 6000, // 6 seconds per slide (longer for video content)
                disableOnInteraction: false, // Keep autoplay after user interaction
                pauseOnMouseEnter: true, // Pause when hovering
            },
            
            // Pagination
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: false,
            },
            
            // Performance settings from Swiper docs
            speed: 1000, // Smooth transition speed for fade
            watchSlidesProgress: true,
            preloadImages: false,
            
            // Video handling
            on: {
                init: () => {
                    console.log('🎬 Swiper initialized');
                    // Play first video immediately
                    setTimeout(() => this.handleSlideTransitionEnd(), 500);
                },
                slideChange: () => {
                    this.handleSlideChange();
                },
                slideChangeTransitionEnd: () => {
                    this.handleSlideTransitionEnd();
                }
            }
        });

        console.log('🎬 Swiper gamemode carousel initialized successfully');
    }

    handleSlideChange() {
        // Pause all videos first
        const allVideos = document.querySelectorAll('.gamemode-swiper video');
        allVideos.forEach(video => {
            if (!video.paused) {
                video.pause();
            }
        });
    }

    handleSlideTransitionEnd() {
        // Play the current slide's video
        const activeSlide = document.querySelector('.gamemode-swiper .swiper-slide-active');
        const video = activeSlide?.querySelector('video');
        
        if (video) {
            console.log('🎬 Playing video for active slide:', video.dataset.src || video.src);
            
            // Force load the video if not already loaded
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
                const source = video.querySelector('source');
                if (source && source.dataset.src) {
                    source.src = source.dataset.src;
                }
                video.load();
            }
            
            // Play video when ready
            const playVideo = () => {
                video.play().then(() => {
                    console.log('✅ Video playing successfully');
                    }).catch(error => {
                    console.warn('❌ Video autoplay failed:', error);
                    });
                };
                
            if (video.readyState >= 2) {
                // Video has enough data to play
                playVideo();
                } else {
                    // Wait for video to be ready
                video.addEventListener('canplay', playVideo, { once: true });
                
                // Fallback timeout
                            setTimeout(() => {
                    if (video.readyState >= 2) {
                        playVideo();
                    }
                }, 1000);
            }
        }
    }

    setupScrollAnimations() {
        if (typeof gsap === 'undefined' || !gsap.registerPlugin) return;
        
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate header elements
        gsap.fromTo('.gamemode-main-title', 
            { opacity: 0, y: 30 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '.gamemode-section',
                    start: 'top 80%',
                    end: 'top 20%',
                    once: true
                }
            }
        );

        gsap.fromTo('.gamemode-description', 
            { opacity: 0, y: 30 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.8,
                ease: "power2.out",
                delay: 0.2,
                scrollTrigger: {
                    trigger: '.gamemode-section',
                    start: 'top 80%',
                    end: 'top 20%',
                    once: true
                }
            }
        );
        
        // Animate section entrance
        gsap.fromTo('.gamemode-swiper', 
            { opacity: 0, y: 50 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '.gamemode-swiper',
                    start: 'top 80%',
                    end: 'top 20%',
                    once: true
                }
            }
        );

        // Initialize blood splatter animation
        this.initGamemodeBloodsplatterReveal();
    }

    initGamemodeBloodsplatterReveal() {
        const splatterElement = document.querySelector('.bloodsplatter-decoration-header-center');
        const img = splatterElement?.querySelector('img');
        
        if (!img) return;

        const tl = gsap.timeline({ paused: true });
        
        gsap.set(img, {
            clipPath: 'polygon(50% 50%)'
        });

        tl.to(img, {
            duration: 0.8,
            ease: "power3.out",
            onUpdate: function() {
                const progress = this.progress();
                const radius = Math.min(100, progress * 120);
                img.style.clipPath = `circle(${radius}% at 50% 50%)`;
            }
        });

        ScrollTrigger.create({
            trigger: '.gamemode-header',
            start: "top 80%",
            onEnter: () => {
                gsap.delayedCall(0.3, () => {
                    tl.play();
                });
            }
        });
    }

    // Handle tab visibility
    handleVisibilityChange() {
        if (document.hidden) {
            this.swiper?.autoplay?.stop();
        } else {
            this.swiper?.autoplay?.start();
        }
    }

    destroy() {
        if (this.swiper) {
            this.swiper.destroy(true, true);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
        const gamemodeSection = document.querySelector('.gamemode-section');
        
        if (gamemodeSection) {
            window.gamemodeSection = new GamemodeSection();
        
        // Handle tab visibility
        document.addEventListener('visibilitychange', () => {
            window.gamemodeSection.handleVisibilityChange();
        });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.gamemodeSection) {
        window.gamemodeSection.destroy();
    }
});