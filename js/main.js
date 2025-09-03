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

// Video Lazy Loading and Performance Optimization
// Utilizes Intersection Observer API for efficient video loading

class VideoLazyLoader {
    constructor() {
        this.videos = [];
        this.loadedVideos = new Set();
        this.activeVideos = new Set();
        this.currentlyPlayingVideo = null; // Track currently playing video for single playback
        this.intersectionObserver = null;
        this.visibilityObserver = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find all lazy-loading videos
        this.videos = Array.from(document.querySelectorAll('.lazy-video'));
        
        if (this.videos.length === 0) {
            return;
        }

        // Create intersection observer for loading videos when they enter viewport
        this.createIntersectionObserver();
        
        // Create visibility observer for pausing/playing videos based on visibility
        this.createVisibilityObserver();
        
        // Create special observer for landing video
        this.createLandingVideoObserver();
        
        // Observe all videos
        this.videos.forEach(video => {
            this.intersectionObserver.observe(video);
            
            // Use special observer for landing video, regular for showcase videos
            if (video.classList.contains('landing-background-video')) {
                this.landingVideoObserver.observe(video);
                // Prioritize loading the landing video immediately
                this.loadVideo(video);
            } else {
                this.visibilityObserver.observe(video);
            }
        });

        // Add performance monitoring
        this.addPerformanceMonitoring();
        
        console.log(`Video Lazy Loader initialized with ${this.videos.length} videos`);
    }

    createIntersectionObserver() {
        // Observer for loading videos when they come into view
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.loadedVideos.has(entry.target)) {
                    this.loadVideo(entry.target);
                }
            });
        }, {
            // Load video when it's 200px away from entering viewport
            rootMargin: '200px 0px',
            threshold: 0
        });
    }

    createVisibilityObserver() {
        // Observer for playing/pausing videos based on visibility
        this.visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                
                if (entry.isIntersecting) {
                    // Video is visible - play if loaded
                    if (this.loadedVideos.has(video)) {
                        this.playVideo(video);
                    }
                } else {
                    // Video is not visible - pause to save resources
                    // Exception: Don't pause landing background video as it's always meant to be playing
                    if (!video.classList.contains('landing-background-video')) {
                        this.pauseVideo(video);
                    }
                }
            });
        }, {
            // Trigger when 25% of video is visible for showcase videos
            // Landing video gets different treatment with larger threshold
            rootMargin: '50px',
            threshold: 0.25
        });
    }

    createLandingVideoObserver() {
        // Special observer for landing background video
        // This ensures the landing video stays playing when visible and pauses when completely out of view
        this.landingVideoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                
                if (entry.isIntersecting) {
                    // Landing video is visible - ensure it's playing
                    if (this.loadedVideos.has(video)) {
                        this.playVideo(video);
                    }
                } else {
                    // Landing video is completely out of view - pause to save resources
                    this.pauseVideo(video);
                }
            });
        }, {
            // Only pause when completely out of view
            rootMargin: '0px',
            threshold: 0
        });
    }

    async loadVideo(video) {
        if (this.loadedVideos.has(video)) {
            return;
        }

        try {
            // Mark as loading
            video.classList.add('video-loading');
            
            // Get the video source from data-src
            const dataSrc = video.getAttribute('data-src');
            const source = video.querySelector('source');
            
            if (dataSrc) {
                // Set the actual src attributes
                video.src = dataSrc;
                if (source) {
                    source.src = dataSrc;
                }
                
                // Load the video
                await this.preloadVideo(video);
                
                // Mark as loaded
                this.loadedVideos.add(video);
                video.classList.remove('video-loading');
                video.classList.add('video-loaded');
                
                // Start playing if in viewport
                const rect = video.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isVisible) {
                    this.playVideo(video);
                }
                
                console.log(`Video loaded: ${dataSrc}`);
            }
        } catch (error) {
            console.warn(`Failed to load video: ${video.getAttribute('data-src')}`, error);
            video.classList.remove('video-loading');
            video.classList.add('video-error');
        }
    }

    preloadVideo(video) {
        return new Promise((resolve, reject) => {
            // Set up event listeners
            const onLoadedData = () => {
                cleanup();
                resolve();
            };
            
            const onError = (error) => {
                cleanup();
                reject(error);
            };
            
            const cleanup = () => {
                video.removeEventListener('loadeddata', onLoadedData);
                video.removeEventListener('error', onError);
            };
            
            // Add event listeners
            video.addEventListener('loadeddata', onLoadedData, { once: true });
            video.addEventListener('error', onError, { once: true });
            
            // Start loading
            video.load();
            
            // Timeout after 10 seconds
            setTimeout(() => {
                cleanup();
                reject(new Error('Video load timeout'));
            }, 10000);
        });
    }

    playVideo(video) {
        if (!this.loadedVideos.has(video) || this.activeVideos.has(video)) {
            return;
        }

        // SINGLE VIDEO PLAYBACK: Pause currently playing video before starting new one
        if (this.currentlyPlayingVideo && this.currentlyPlayingVideo !== video) {
            this.pauseVideo(this.currentlyPlayingVideo);
        }

        try {
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.activeVideos.add(video);
                        this.currentlyPlayingVideo = video; // Set as currently playing
                        video.classList.add('video-playing');
                    })
                    .catch(error => {
                        console.warn('Video play failed:', error);
                        // Reset currentlyPlayingVideo on failure
                        if (this.currentlyPlayingVideo === video) {
                            this.currentlyPlayingVideo = null;
                        }
                    });
            } else {
                this.activeVideos.add(video);
                this.currentlyPlayingVideo = video; // Set as currently playing
                video.classList.add('video-playing');
            }
        } catch (error) {
            console.warn('Video play error:', error);
            // Reset currentlyPlayingVideo on error
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
            
            // Clear currently playing video if this is the one being paused
            if (this.currentlyPlayingVideo === video) {
                this.currentlyPlayingVideo = null;
            }
        } catch (error) {
            console.warn('Video pause error:', error);
        }
    }

    addPerformanceMonitoring() {
        // Monitor network conditions and adjust loading behavior
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // Adjust loading strategy based on connection
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // On slow connections, increase the intersection margin to load earlier
                this.intersectionObserver.disconnect();
                this.createIntersectionObserver();
            }
            
            // Listen for connection changes
            connection.addEventListener('change', () => {
                console.log(`Connection changed: ${connection.effectiveType}`);
            });
        }

        // Monitor memory usage if available - improved memory management
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryUsageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
                
                if (memoryUsageRatio > 0.9) {
                    console.warn('High memory usage detected, pausing non-visible videos');
                    this.pauseAllNonVisibleVideos();
                } else if (memoryUsageRatio > 0.8) {
                    console.warn('Moderate memory usage detected, pausing currently playing video if not in view');
                    // More aggressive memory management - pause current video if not fully visible
                    if (this.currentlyPlayingVideo) {
                        const rect = this.currentlyPlayingVideo.getBoundingClientRect();
                        const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                        if (!isFullyVisible) {
                            this.pauseVideo(this.currentlyPlayingVideo);
                        }
                    }
                }
            }, 8000); // Check every 8 seconds for better responsiveness
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

    // Public methods for manual control
    forceLoadVideo(videoElement) {
        if (videoElement && videoElement.classList.contains('lazy-video')) {
            this.loadVideo(videoElement);
        }
    }

    getStats() {
        return {
            totalVideos: this.videos.length,
            loadedVideos: this.loadedVideos.size,
            activeVideos: this.activeVideos.size
        };
    }

    destroy() {
        // Clean up observers
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        if (this.visibilityObserver) {
            this.visibilityObserver.disconnect();
        }
        if (this.landingVideoObserver) {
            this.landingVideoObserver.disconnect();
        }
        
        // Pause all active videos
        this.activeVideos.forEach(video => {
            video.pause();
        });
        
        // Clear sets and references
        this.loadedVideos.clear();
        this.activeVideos.clear();
        this.currentlyPlayingVideo = null;
    }

    // Public method to get currently playing video
    getCurrentlyPlayingVideo() {
        return this.currentlyPlayingVideo;
    }
}

// Initialize when DOM is ready
let videoLazyLoader;

document.addEventListener('DOMContentLoaded', () => {
    videoLazyLoader = new VideoLazyLoader();
});

// Export for global access
window.VideoLazyLoader = {
    getInstance: () => videoLazyLoader,
    forceLoadVideo: (video) => videoLazyLoader?.forceLoadVideo(video),
    getStats: () => videoLazyLoader?.getStats() || { totalVideos: 0, loadedVideos: 0, activeVideos: 0 },
    getCurrentlyPlayingVideo: () => videoLazyLoader?.getCurrentlyPlayingVideo() || null,
    playVideo: (video) => videoLazyLoader?.playVideo(video),
    pauseVideo: (video) => videoLazyLoader?.pauseVideo(video)
};

// Handle page visibility changes to pause all videos when tab is not active
document.addEventListener('visibilitychange', () => {
    if (videoLazyLoader) {
        if (document.hidden) {
            videoLazyLoader.pauseAllNonVisibleVideos();
        }
    }
}); 