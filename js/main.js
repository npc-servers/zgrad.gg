// Main JavaScript file for shared functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize any global functionality here
    console.log('ZGrad.gg website loaded');
    
    // Add smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Enhanced Video Management with Vanilla-LazyLoad
// Combines Vanilla-LazyLoad with custom video optimization features

class EnhancedVideoManager {
    constructor() {
        this.currentlyPlayingVideo = null;
        this.activeVideos = new Set();
        this.loadedVideos = new Set();
        this.lazyLoadInstance = null;
        this.memoryMonitorInterval = null;
        
        this.init();
    }

    init() {
        // Wait for DOM and Vanilla-LazyLoad to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Check if Vanilla-LazyLoad is available
        if (typeof LazyLoad === 'undefined') {
            console.error('Vanilla-LazyLoad not found. Please include the library.');
            return;
        }

        // Initialize Vanilla-LazyLoad with video-optimized settings
        this.lazyLoadInstance = new LazyLoad({
            elements_selector: '.lazy-video',
            threshold: 0,
            rootMargin: '200px 0px',
            callback_loading: (element) => {
                console.log('Loading video:', element.dataset.src);
                element.classList.add('video-loading');
            },
            callback_loaded: (element) => {
                console.log('Video loaded:', element.dataset.src);
                this.handleVideoLoaded(element);
            },
            callback_error: (element) => {
                console.warn('Video loading failed:', element.dataset.src);
                element.classList.add('video-error');
            },
            callback_enter: (element) => {
                // Video entered viewport
                this.handleVideoEnterViewport(element);
            },
            callback_exit: (element) => {
                // Video left viewport
                this.handleVideoExitViewport(element);
            }
        });

        // Set up visibility observers for play/pause control
        this.setupVideoVisibilityControl();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        const videoCount = document.querySelectorAll('.lazy-video').length;
        console.log(`Enhanced Video Manager initialized with ${videoCount} videos using Vanilla-LazyLoad`);
    }

    handleVideoLoaded(video) {
        this.loadedVideos.add(video);
        video.classList.remove('video-loading');
        video.classList.add('video-loaded');
        
        // Check if video is in viewport and should start playing
        const rect = video.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            // Delay to ensure video is fully ready
            setTimeout(() => {
                this.playVideo(video);
            }, 100);
        }
    }

    handleVideoEnterViewport(video) {
        // Video is entering viewport - prepare for playback if loaded
        if (this.loadedVideos.has(video)) {
            setTimeout(() => {
                this.playVideo(video);
            }, 100);
        }
    }

    handleVideoExitViewport(video) {
        // Video left viewport - pause unless it's the landing background video
        if (!video.classList.contains('landing-background-video')) {
            this.pauseVideo(video);
        }
    }

    setupVideoVisibilityControl() {
        // Most Visible Video tracking system
        this.videoVisibilityTracker = new Map();
        this.mostVisibleVideo = null;
        this.updateMostVisibleTimeout = null;

        // Enhanced visibility observer with multiple thresholds for precise tracking
        const playbackObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                
                if (entry.isIntersecting) {
                    // Update visibility ratio for this video
                    this.videoVisibilityTracker.set(video, entry.intersectionRatio);
                    
                    // Add visual class when substantially visible
                    if (entry.intersectionRatio >= 0.6) {
                        video.closest('.showcase-item')?.classList.add('in-view');
                    } else {
                        video.closest('.showcase-item')?.classList.remove('in-view');
                    }
                } else {
                    // Remove from tracking when not intersecting
                    this.videoVisibilityTracker.delete(video);
                    video.closest('.showcase-item')?.classList.remove('in-view');
                    
                    // If this was the most visible video, clear it
                    if (this.mostVisibleVideo === video) {
                        this.mostVisibleVideo = null;
                    }
                }
                
                // Update which video should be playing based on visibility
                this.debouncedUpdateMostVisible();
            });
        }, {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], // Multiple thresholds for precise visibility tracking
            rootMargin: '50px'
        });

        // Special observer for landing video (simpler logic)
        const landingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (this.loadedVideos.has(video)) {
                        this.playVideo(video);
                    }
                } else {
                    this.pauseVideo(video);
                }
            });
        }, {
            threshold: 0,
            rootMargin: '0px'
        });

        // Observe all videos with appropriate observer
        document.querySelectorAll('.lazy-video').forEach(video => {
            if (video.classList.contains('landing-background-video')) {
                landingObserver.observe(video);
            } else {
                playbackObserver.observe(video);
            }
        });

        // Add scroll-based recalculation for smoother most visible video detection
        this.setupScrollBasedVisibilityUpdate();
    }

    // Function to determine and play the most visible video
    updateMostVisibleVideo() {
        let highestRatio = 0;
        let targetVideo = null;
        let bestCenterDistance = Infinity;
        
        const viewportCenter = window.innerHeight / 2;
        
        // Find the video with the highest visibility ratio (with tie-breaker for center proximity)
        this.videoVisibilityTracker.forEach((ratio, video) => {
            if (ratio > 0.1 && video.readyState >= 2) { // Only consider videos that are somewhat visible and loaded
                const showcaseItem = video.closest('.showcase-item');
                if (showcaseItem) {
                    const rect = showcaseItem.getBoundingClientRect();
                    const elementCenter = rect.top + (rect.height / 2);
                    const distanceFromCenter = Math.abs(viewportCenter - elementCenter);
                    
                    // Prefer higher visibility ratio, but if ratios are close (within 0.1), prefer center proximity
                    if (ratio > highestRatio || (Math.abs(ratio - highestRatio) <= 0.1 && distanceFromCenter < bestCenterDistance)) {
                        highestRatio = ratio;
                        targetVideo = video;
                        bestCenterDistance = distanceFromCenter;
                    }
                }
            }
        });
        
        // Only play if visibility is substantial (at least 30%)
        if (targetVideo && highestRatio >= 0.3) {
            if (this.mostVisibleVideo !== targetVideo) {
                // Pause the previously most visible video
                if (this.mostVisibleVideo) {
                    this.pauseVideo(this.mostVisibleVideo);
                }
                
                // Play the new most visible video
                this.mostVisibleVideo = targetVideo;
                this.playVideo(targetVideo);
                
                // Debug logging
                console.log(`Playing most visible video (${Math.round(highestRatio * 100)}% visible)`);
            }
        } else {
            // No video is sufficiently visible, pause current if any
            if (this.mostVisibleVideo) {
                this.pauseVideo(this.mostVisibleVideo);
                this.mostVisibleVideo = null;
            }
        }
    }

    // Debounced update function to prevent excessive calculations
    debouncedUpdateMostVisible() {
        clearTimeout(this.updateMostVisibleTimeout);
        this.updateMostVisibleTimeout = setTimeout(() => {
            this.updateMostVisibleVideo();
        }, 50);
    }

    setupScrollBasedVisibilityUpdate() {
        let scrollUpdateTimeout = null;
        
        const onScroll = () => {
            clearTimeout(scrollUpdateTimeout);
            scrollUpdateTimeout = setTimeout(() => {
                // Recalculate visibility ratios during scroll for more responsive video switching
                if (this.videoVisibilityTracker.size > 0) {
                    // Force update visibility ratios by manually checking each tracked video
                    this.videoVisibilityTracker.forEach((ratio, video) => {
                        const showcaseItem = video.closest('.showcase-item');
                        if (showcaseItem) {
                            const rect = showcaseItem.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            
                            // Calculate precise intersection ratio
                            const visibleTop = Math.max(0, rect.top);
                            const visibleBottom = Math.min(viewportHeight, rect.bottom);
                            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
                            const elementHeight = rect.height;
                            const newRatio = elementHeight > 0 ? visibleHeight / elementHeight : 0;
                            
                            // Update tracking with new ratio
                            if (newRatio > 0) {
                                this.videoVisibilityTracker.set(video, newRatio);
                            } else {
                                this.videoVisibilityTracker.delete(video);
                            }
                        }
                    });
                    
                    this.debouncedUpdateMostVisible();
                }
            }, 100); // Update during scroll every 100ms
        };
        
        // Listen for scroll events to ensure most visible video is always playing
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Store reference for cleanup
        this.scrollHandler = onScroll;
        this.scrollUpdateTimeout = scrollUpdateTimeout;
    }

    playVideo(video) {
        if (!this.loadedVideos.has(video) || this.activeVideos.has(video)) {
            return;
        }

        // Single video playback policy - pause currently playing video
        if (this.currentlyPlayingVideo && this.currentlyPlayingVideo !== video) {
            this.pauseVideo(this.currentlyPlayingVideo);
        }

        try {
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.activeVideos.add(video);
                        this.currentlyPlayingVideo = video;
                        video.classList.add('video-playing');
                        console.log('Video playing:', video.dataset.src || video.src);
                    })
                    .catch(error => {
                        console.warn('Video play failed:', error);
                        if (this.currentlyPlayingVideo === video) {
                            this.currentlyPlayingVideo = null;
                        }
                    });
            } else {
                this.activeVideos.add(video);
                this.currentlyPlayingVideo = video;
                video.classList.add('video-playing');
            }
        } catch (error) {
            console.warn('Video play error:', error);
            if (this.currentlyPlayingVideo === video) {
                this.currentlyPlayingVideo = null;
            }
        }
    }

    pauseVideo(video) {
        if (!this.activeVideos.has(video)) {
            return;
        }

        try {
            video.pause();
            this.activeVideos.delete(video);
            video.classList.remove('video-playing');
            
            if (this.currentlyPlayingVideo === video) {
                this.currentlyPlayingVideo = null;
            }
        } catch (error) {
            console.warn('Video pause error:', error);
        }
    }

    startPerformanceMonitoring() {
        // Monitor memory usage and network conditions
        if ('memory' in performance) {
            this.memoryMonitorInterval = setInterval(() => {
                const memory = performance.memory;
                const memoryUsageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
                
                if (memoryUsageRatio > 0.9) {
                    console.warn('High memory usage detected, pausing non-visible videos');
                    this.pauseAllNonVisibleVideos();
                } else if (memoryUsageRatio > 0.8 && this.currentlyPlayingVideo) {
                    const rect = this.currentlyPlayingVideo.getBoundingClientRect();
                    const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                    if (!isFullyVisible) {
                        this.pauseVideo(this.currentlyPlayingVideo);
                    }
                }
            }, 10000);
        }

        // Monitor network conditions
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                console.log(`Network changed: ${navigator.connection.effectiveType}`);
            });
        }
    }

    pauseAllNonVisibleVideos() {
        this.activeVideos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (!isVisible) {
                this.pauseVideo(video);
            }
        });
    }

    // Public API methods for compatibility
    forceLoadVideo(video) {
        if (video && video.classList.contains('lazy-video')) {
            // Use Vanilla-LazyLoad's load method
            if (this.lazyLoadInstance) {
                this.lazyLoadInstance.load(video);
            }
        }
    }

    getStats() {
        return {
            totalVideos: document.querySelectorAll('.lazy-video').length,
            loadedVideos: this.loadedVideos.size,
            activeVideos: this.activeVideos.size,
            currentlyPlaying: this.currentlyPlayingVideo ? 1 : 0
        };
    }

    getCurrentlyPlayingVideo() {
        return this.currentlyPlayingVideo;
    }

    // Debug methods for most visible video system
    getMostVisibleVideoStats() {
        const stats = [];
        this.videoVisibilityTracker.forEach((ratio, video) => {
            const showcaseItem = video.closest('.showcase-item');
            const index = showcaseItem ? Array.from(document.querySelectorAll('.showcase-item')).indexOf(showcaseItem) + 1 : 'unknown';
            stats.push({
                video: `Video ${index}`,
                visibility: `${Math.round(ratio * 100)}%`,
                isPlaying: video === this.mostVisibleVideo,
                readyState: video.readyState,
                src: video.dataset.src || video.src
            });
        });
        return stats.sort((a, b) => parseFloat(b.visibility) - parseFloat(a.visibility));
    }

    getMostVisibleVideo() {
        return this.mostVisibleVideo;
    }

    destroy() {
        if (this.lazyLoadInstance) {
            this.lazyLoadInstance.destroy();
        }
        
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
        }

        // Clean up most visible video tracking
        if (this.updateMostVisibleTimeout) {
            clearTimeout(this.updateMostVisibleTimeout);
        }

        if (this.scrollUpdateTimeout) {
            clearTimeout(this.scrollUpdateTimeout);
        }

        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }

        if (this.videoVisibilityTracker) {
            this.videoVisibilityTracker.clear();
        }
        
        this.activeVideos.forEach(video => {
            video.pause();
        });
        
        this.loadedVideos.clear();
        this.activeVideos.clear();
        this.currentlyPlayingVideo = null;
        this.mostVisibleVideo = null;
    }
}

// Initialize when DOM is ready
let enhancedVideoManager;

document.addEventListener('DOMContentLoaded', () => {
    enhancedVideoManager = new EnhancedVideoManager();
});

// Export for global access - maintain compatibility with existing code
window.VideoLazyLoader = {
    getInstance: () => enhancedVideoManager,
    forceLoadVideo: (video) => enhancedVideoManager?.forceLoadVideo(video),
    getStats: () => enhancedVideoManager?.getStats() || { totalVideos: 0, loadedVideos: 0, activeVideos: 0 },
    getCurrentlyPlayingVideo: () => enhancedVideoManager?.getCurrentlyPlayingVideo() || null,
    playVideo: (video) => enhancedVideoManager?.playVideo(video),
    pauseVideo: (video) => enhancedVideoManager?.pauseVideo(video),
    // Debug methods for most visible video system
    getMostVisibleVideoStats: () => enhancedVideoManager?.getMostVisibleVideoStats() || [],
    getMostVisibleVideo: () => enhancedVideoManager?.getMostVisibleVideo() || null
};

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (enhancedVideoManager && document.hidden) {
        enhancedVideoManager.pauseAllNonVisibleVideos();
    }
}); 