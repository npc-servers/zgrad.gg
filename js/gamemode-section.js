// Enhanced Gamemode Section integrated with existing VideoLazyLoader
class GamemodeSection {
    constructor() {
        this.swiper = null;
        this.currentActiveVideo = null;
        this.swiperObserver = null;
        this.init();
    }

    init() {
        // Wait for all dependencies to be available
        if (typeof Swiper === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Wait for EnhancedVideoManager to be ready
        if (typeof window.VideoLazyLoader === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.setupSwiperVideoIntegration();
        this.initSwiper();
        this.setupScrollAnimations();
    }

    setupSwiperVideoIntegration() {
        // Hook into the existing VideoLazyLoader system without breaking global functionality
        console.log('🎬 Setting up Swiper video integration with global VideoLazyLoader');
        
        // Set up swiper-specific visibility tracking for scroll-based resume
        this.setupSwiperVisibilityTracking();
    }

    setupSwiperVisibilityTracking() {
        // Create intersection observer specifically for the swiper container
        const swiperObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    // Swiper came into view - resume active slide video and autoplay
                    console.log('🎬 Swiper came into view - resuming autoplay and active video');
                    this.swiper?.autoplay?.start();
                    setTimeout(() => this.handleActiveSlideVideo(), 100);
                } else {
                    // Swiper left view - pause all swiper videos and autoplay
                    console.log('🎬 Swiper left view - pausing autoplay and all videos');
                    this.swiper?.autoplay?.stop();
                    this.pauseAllSwiperVideos();
                }
            });
        }, {
            threshold: [0, 0.25, 0.5, 0.75, 1.0],
            rootMargin: '100px 0px'
        });

        // Observe the swiper container
        const swiperContainer = document.querySelector('.gamemode-swiper');
        if (swiperContainer) {
            swiperObserver.observe(swiperContainer);
            this.swiperObserver = swiperObserver;
            console.log('🎬 Swiper visibility tracking enabled');
        }
    }

    isSwiperVideo(video) {
        return video.closest('.gamemode-swiper') !== null;
    }

    isVideoInActiveSlide(video) {
        const slide = video.closest('.swiper-slide');
        return slide && slide.classList.contains('swiper-slide-active');
    }

    initSwiper() {
        this.swiper = new Swiper('.gamemode-swiper', {
            // Basic settings
            loop: true,
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            
            // Auto-rotation settings
            autoplay: {
                delay: 6000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            
            // Pagination
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: false,
            },
            
            // Performance settings
            speed: 1000,
            watchSlidesProgress: true,
            preloadImages: false,
            lazy: false, // We use the global VideoLazyLoader system
            
            // Video handling integrated with global system
            on: {
                init: () => {
                    console.log('🎬 Swiper initialized - integrating with VideoLazyLoader');
                    // Let the global system handle loading, just manage active slide logic
                    setTimeout(() => {
                        // Only start video if swiper is visible
                        if (this.isSwiperInViewport()) {
                            this.handleActiveSlideVideo();
                        }
                    }, 1000);
                },
                slideChangeTransitionEnd: () => {
                    // Only handle video if swiper is visible
                    if (this.isSwiperInViewport()) {
                        this.handleActiveSlideVideo();
                    } else {
                        console.log('🎬 Swiper not visible - skipping video handling');
                    }
                }
            }
        });

        console.log('🎬 Swiper initialized with VideoLazyLoader integration');
    }

    handleActiveSlideVideo() {
        // Pause any currently playing swiper video
        if (this.currentActiveVideo) {
            console.log('🎬 Pausing previous swiper video');
            window.VideoLazyLoader.pauseVideo(this.currentActiveVideo);
            this.currentActiveVideo = null;
        }

        // Pause all other swiper videos first
        this.pauseAllSwiperVideos();

        // Get the active slide's video
        const activeSlide = document.querySelector('.gamemode-swiper .swiper-slide-active');
        const video = activeSlide?.querySelector('.lazy-video');
        
        if (video) {
            console.log('🎬 Handling active slide video:', video.dataset.src || 'loading...');
            
            // Let the global VideoLazyLoader system handle loading and playing
            setTimeout(() => {
                if (window.VideoLazyLoader.getInstance()) {
                    const videoManager = window.VideoLazyLoader.getInstance();
                    
                    // Force load if not already loaded (uses existing LazyLoad system)
                    if (!videoManager.loadedVideos.has(video)) {
                        console.log('🎬 Requesting video load from VideoLazyLoader');
                        videoManager.forceLoadVideo(video);
                    }
                    
                    // Use the original VideoLazyLoader system to play
                    window.VideoLazyLoader.playVideo(video);
                    this.currentActiveVideo = video;
                }
            }, 100);
        }
    }

    isSwiperInViewport() {
        const swiperContainer = document.querySelector('.gamemode-swiper');
        if (!swiperContainer) return false;
        
        const rect = swiperContainer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if at least 50% of swiper is visible
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(windowHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const totalHeight = rect.height;
        
        return totalHeight > 0 && (visibleHeight / totalHeight) > 0.5;
    }

    pauseAllSwiperVideos() {
        // Pause all swiper videos
        const allSwiperVideos = document.querySelectorAll('.gamemode-swiper .lazy-video');
        allSwiperVideos.forEach(video => {
            window.VideoLazyLoader.pauseVideo(video);
        });
        
        if (this.currentActiveVideo) {
            this.currentActiveVideo = null;
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
        
        // Animate section entrance - static animation without ScrollTrigger
        gsap.set('.gamemode-swiper', { opacity: 1, y: 0 });
        
        // Optional: Simple fade-in on page load without scroll dependency
        gsap.fromTo('.gamemode-swiper', 
            { opacity: 0, y: 30 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 1,
                ease: "power2.out",
                delay: 0.5 // Simple delay-based animation
            }
        );

        // Blood splatter animation is now handled by the showcase animation system
    }

    // Handle tab visibility with video management
    handleVisibilityChange() {
        if (document.hidden) {
            this.swiper?.autoplay?.stop();
            console.log('🎬 Tab hidden - letting global VideoLazyLoader handle pause');
            // The global VideoLazyLoader will handle pausing videos appropriately
        } else {
            this.swiper?.autoplay?.start();
            console.log('🎬 Tab visible - resuming active slide video');
            
            // Resume active slide video only if swiper is visible
            setTimeout(() => {
                if (this.isSwiperInViewport()) {
                    this.handleActiveSlideVideo();
                } else {
                    console.log('🎬 Swiper not in viewport - not resuming video');
                }
            }, 200);
        }
    }

    destroy() {
        // Pause any active swiper video
        if (this.currentActiveVideo) {
            window.VideoLazyLoader.pauseVideo(this.currentActiveVideo);
        }
        
        // Clean up intersection observer
        if (this.swiperObserver) {
            this.swiperObserver.disconnect();
            this.swiperObserver = null;
        }
        
        // Clean up Swiper
        if (this.swiper) {
            this.swiper.destroy(true, true);
            this.swiper = null;
        }
        
        // Clean up current video reference
        this.currentActiveVideo = null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gamemodeSection = document.querySelector('.gamemode-section');
    
    if (gamemodeSection) {
        // Wait a bit for other systems to initialize
        setTimeout(() => {
            window.gamemodeSection = new GamemodeSection();
            
            // Handle tab visibility
            document.addEventListener('visibilitychange', () => {
                if (window.gamemodeSection) {
                    window.gamemodeSection.handleVisibilityChange();
                }
            });
            
            console.log('🎬 Enhanced Gamemode Section with VideoLazyLoader integration initialized');
        }, 1000); // Increased delay to ensure VideoLazyLoader is fully ready
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.gamemodeSection) {
        window.gamemodeSection.destroy();
    }
});