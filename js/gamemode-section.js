// Optimized Gamemode Section JavaScript
class GamemodeSection {
    constructor() {
        this.currentIndex = 0;
        this.gamemodes = [
            {
                title: "TACTICAL TTT",
                description: "Experience the classic Trouble in Terrorist Town with enhanced tactical elements. Use strategy, deception, and teamwork to survive in this intense multiplayer experience.",
                video: "videos/classes_demo1.webm"
            },
            {
                title: "COMBAT ZONE",
                description: "Engage in intense firefights with realistic weapon mechanics and physics-based combat. Master different weapon types and tactical positioning.",
                video: "videos/shooting.webm"
            },
            {
                title: "SURVIVAL MODE",
                description: "Test your survival skills with advanced medical systems and environmental challenges. Every decision matters in this hardcore survival experience.",
                video: "videos/medical_demo1.webm"
            },
            {
                title: "PARKOUR ARENA",
                description: "Navigate complex environments using advanced movement mechanics including ragdoll climbing and physics-based traversal.",
                video: "videos/climbing.webm"
            },
            {
                title: "WEAPON MASTERY",
                description: "Master our extensive arsenal of custom weapons, each with unique mechanics and tactical applications for different combat scenarios.",
                video: "videos/weapon_demo1.webm"
            },
            {
                title: "GORE & REALISM",
                description: "Experience unparalleled realism with advanced damage systems and visual feedback that adds weight to every encounter.",
                video: "videos/gore_demo1.webm"
            }
        ];
        this.isTransitioning = false;
        this.autoRotateTimeout = null;
        this.autoRotateDelay = 6000; // 6 seconds - fallback timer
        this.isPaused = false;
        this.currentVideoElement = null;
        this.sectionObserver = null;
        this.memoryMonitorInterval = null;
        this.isVisible = false;
        this.videoPlayStartTime = null;
        this.waitingForVideoComplete = false;
        this.videoCompleteTimeout = null;
        
        this.init();
    }

    init() {
        this.initializeVideoSystem();
        this.bindEvents();
        this.setupSectionVisibilityObserver();
        this.startAutoRotate();
        this.setupScrollAnimations();
        this.startMemoryMonitoring();
    }

    initializeVideoSystem() {
        const container = document.querySelector('.gamemode-video-container');
        const existingVideo = container?.querySelector('.gamemode-video');
        
        if (!container) {
            console.error('Gamemode video container not found');
            return;
        }

        if (!existingVideo) {
            console.error('Existing gamemode video not found');
            return;
        }


        // Instead of creating a pool, we'll update the existing video's source
        // This maintains compatibility with the global VideoLazyLoader system
        this.currentVideoElement = existingVideo;
        
        // Set up the initial video
        this.updateVideoSource(0);
        
        // Ensure initial video is fully visible and remove any fade classes
        this.currentVideoElement.style.opacity = '1';
        this.currentVideoElement.classList.remove('fade-out');
        this.currentVideoElement.classList.add('fade-in');
        
    }

    updateVideoSource(gamemodeIndex) {
        if (!this.currentVideoElement) {
            console.error('No current video element available');
            return;
        }

        const gamemode = this.gamemodes[gamemodeIndex];
        if (!gamemode) {
            console.error('Invalid gamemode index:', gamemodeIndex);
            return;
        }


        // Update the source element
        const source = this.currentVideoElement.querySelector('source');
        if (source) {
            source.setAttribute('data-src', gamemode.video);
            source.src = gamemode.video; // Set actual src for immediate loading
        } else {
            // Create source if it doesn't exist
            const newSource = document.createElement('source');
            newSource.setAttribute('data-src', gamemode.video);
            newSource.src = gamemode.video; // Set actual src
            newSource.type = 'video/webm';
            this.currentVideoElement.appendChild(newSource);
        }

        // Update the video element's data-src and src for VideoLazyLoader
        this.currentVideoElement.setAttribute('data-src', gamemode.video);
        this.currentVideoElement.src = gamemode.video; // Set actual src on video element
        
        // Force the video to reload with new source
        this.currentVideoElement.load();
        
    }

    loadInitialVideo() {
        if (!this.currentVideoElement) {
            console.error('No current video element available');
            return;
        }

        
        // Ensure video is visible from the start
        this.currentVideoElement.style.opacity = '1';
        this.currentVideoElement.classList.remove('fade-out');
        this.currentVideoElement.classList.add('fade-in');
        
        // Use the enhanced VideoLazyLoader system (now powered by Vanilla-LazyLoad)
        if (window.VideoLazyLoader && window.VideoLazyLoader.forceLoadVideo) {
            window.VideoLazyLoader.forceLoadVideo(this.currentVideoElement);
        } else {
            console.warn('Enhanced Video Manager not available, using direct loading fallback');
            this.playVideoDirectly(this.currentVideoElement);
        }
    }

    playVideoDirectly(video) {
        if (!video) {
            console.error('No video element provided to playVideoDirectly');
            return;
        }
        
        
        const source = video.querySelector('source');
        if (source && source.dataset.src) {
            
            // Set the actual src
            source.src = source.dataset.src;
            video.src = source.dataset.src; // Also set on video element directly
            
            // Add error handling
            video.addEventListener('error', (e) => {
                console.error('Video error:', e, 'Video src:', video.src);
            }, { once: true });
            
            // Add loading progress
            video.addEventListener('loadstart', () => {
                // Video started loading
            }, { once: true });
            
            video.addEventListener('loadedmetadata', () => {
                // Video metadata loaded
            }, { once: true });
            
            // Try to play when loaded
            video.addEventListener('loadeddata', () => {
                video.play().catch(error => {
                    console.warn('❌ Video autoplay failed:', error);
                });
            }, { once: true });
            
            // Start loading
            video.load();
        } else {
            console.error('No source element or data-src found on video');
        }
    }

    setupSectionVisibilityObserver() {
        // Observer to track when gamemode section is visible for auto-rotation optimization
        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (entry.isIntersecting) {
                    // Section came back into view - resume auto-rotation and video playback
                    this.resumeAutoRotate();
                    
                    // Resume video playback if video is ready and loaded
                    if (this.currentVideoElement) {
                        // Use a small delay to ensure the video is properly set up
                        setTimeout(() => {
                            if (this.currentVideoElement.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                                if (window.VideoLazyLoader && window.VideoLazyLoader.playVideo) {
                                    window.VideoLazyLoader.playVideo(this.currentVideoElement);
                                } else {
                                    try {
                                        this.currentVideoElement.play().catch(error => {
                                            console.warn('❌ Failed to resume gamemode video:', error);
                                        });
                                    } catch (e) {
                                        console.warn('Failed to resume video when section came into view:', e);
                                    }
                                }
                            } else if (this.currentVideoElement.readyState < 2) {
                                // Video isn't ready yet, try to force load it
                                if (window.VideoLazyLoader && window.VideoLazyLoader.forceLoadVideo) {
                                    window.VideoLazyLoader.forceLoadVideo(this.currentVideoElement);
                                }
                                
                                // Listen for when it becomes ready
                                const onCanPlay = () => {
                                    this.currentVideoElement.play().catch(error => {
                                        console.warn('❌ Failed to resume gamemode video after loading:', error);
                                    });
                                    this.currentVideoElement.removeEventListener('canplay', onCanPlay);
                                };
                                this.currentVideoElement.addEventListener('canplay', onCanPlay, { once: true });
                                
                                // Fallback timeout in case canplay doesn't fire
                                setTimeout(() => {
                                    this.currentVideoElement.removeEventListener('canplay', onCanPlay);
                                    if (this.currentVideoElement.readyState >= 2) {
                                        this.currentVideoElement.play().catch(error => {
                                            console.warn('❌ Fallback resume failed:', error);
                                        });
                                    }
                                }, 2000);
                            }
                        }, 100);
                    }
                } else {
                    this.pauseAutoRotate();
                    // Pause current video when section is not visible using global system
                    if (this.currentVideoElement) {
                        if (window.VideoLazyLoader && window.VideoLazyLoader.pauseVideo) {
                            window.VideoLazyLoader.pauseVideo(this.currentVideoElement);
                        } else {
                            try {
                                this.currentVideoElement.pause();
                            } catch (e) {
                                console.warn('Failed to pause video when section not visible:', e);
                            }
                        }
                    }
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '50px'
        });

        const section = document.querySelector('.gamemode-section');
        if (section) {
            this.sectionObserver.observe(section);
        }
    }

    startMemoryMonitoring() {
        // Monitor memory usage and adjust behavior accordingly
        if ('memory' in performance) {
            this.memoryMonitorInterval = setInterval(() => {
                const memory = performance.memory;
                const memoryUsageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
                
                if (memoryUsageRatio > 0.8) {
                    // High memory usage - pause auto-rotation and preload only adjacent videos
                    this.handleMemoryPressure();
                }
            }, 10000); // Check every 10 seconds
        }
    }

    handleMemoryPressure() {
        
        // Pause auto-rotation temporarily
        this.pauseAutoRotate();
        
        // Ensure current video is loaded and ready
        if (this.currentVideoElement && window.VideoLazyLoader && window.VideoLazyLoader.forceLoadVideo) {
            window.VideoLazyLoader.forceLoadVideo(this.currentVideoElement);
        }
        
        // Resume auto-rotation after a delay
        setTimeout(() => {
            if (this.isVisible) {
                this.resumeAutoRotate();
            }
        }, 5000);
    }

    bindEvents() {
        // Progress dot click events
        const progressDots = document.querySelectorAll('.progress-dot');
        progressDots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.isTransitioning) {
                    this.goToGamemode(index);
                } else {
                }
            });
        });

        // Pause auto-rotation on hover
        const gamemodeSection = document.querySelector('.gamemode-section');
        if (gamemodeSection) {
            gamemodeSection.addEventListener('mouseenter', () => {
                this.pauseAutoRotate();
            });
            
            gamemodeSection.addEventListener('mouseleave', () => {
                this.resumeAutoRotate();
            });
        }

        // Pause on video interaction
        const videoContainer = document.querySelector('.gamemode-video-container');
        if (videoContainer) {
            videoContainer.addEventListener('mouseenter', () => {
                this.pauseAutoRotate();
            });
            
            videoContainer.addEventListener('mouseleave', () => {
                this.resumeAutoRotate();
            });
        }

        // Handle visibility change (pause when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoRotate();
            } else {
                this.resumeAutoRotate();
            }
        });
    }

    goToGamemode(index) {
        
        if (index === this.currentIndex) {
            return;
        }
        
        if (this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;
        const gamemode = this.gamemodes[index];
        
        // Update content with fade transition
        this.updateContent(gamemode, () => {
            this.currentIndex = index;
            this.updateProgressDots();
            this.isTransitioning = false;
        });
    }

    updateContent(gamemode, callback) {
        const titleElement = document.querySelector('.gamemode-title');
        const subtitleElement = document.querySelector('.gamemode-subtitle');

        if (!titleElement || !subtitleElement || !this.currentVideoElement) return;

        const newIndex = this.gamemodes.indexOf(gamemode);
        
        // Fade out current content
        const elementsToFade = [titleElement, subtitleElement];
        
        // Use a single timeline for better performance and control
        const transitionTimeline = gsap.timeline();
        
        // Fade out animations (parallel)
        transitionTimeline
            .to(elementsToFade, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: "power2.out"
            })
            .to(this.currentVideoElement, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.out"
            }, "<") // Start at the same time as text fade out
            .call(() => {
                // Update text content
                titleElement.textContent = gamemode.title;
                subtitleElement.textContent = gamemode.description;
                
                // Pause current video
                if (window.VideoLazyLoader && window.VideoLazyLoader.pauseVideo) {
                    window.VideoLazyLoader.pauseVideo(this.currentVideoElement);
                } else {
                    try {
                        this.currentVideoElement.pause();
                    } catch (e) {
                        console.warn('Failed to pause video:', e);
                    }
                }
                
                // Update video source (this now includes loading)
                this.updateVideoSource(newIndex);
                
                // Wait for video to be ready, then play
                const onVideoReady = () => {
                    this.currentVideoElement.play().then(() => {
                    }).catch(error => {
                        console.warn('❌ New gamemode video autoplay failed:', error);
                    });
                };
                
                // Listen for when the video is ready to play
                if (this.currentVideoElement.readyState >= 3) {
                    // Video is already ready
                    setTimeout(onVideoReady, 100);
                } else {
                    // Wait for video to be ready
                    this.currentVideoElement.addEventListener('canplay', onVideoReady, { once: true });
                    
                    // Fallback timeout in case canplay doesn't fire
                    setTimeout(onVideoReady, 1000);
                }
            })
            // Fade in video
            .to(this.currentVideoElement, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out"
            }, "+=0.1")
            // Animate text elements in
            .fromTo(elementsToFade, 
                { opacity: 0, y: 20 },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.4, 
                    ease: "power2.out",
                    onComplete: () => {
                        if (callback) callback();
                        
                        // Restart video completion tracking for the new video
                        if (!this.isPaused && this.isVisible) {
                            setTimeout(() => {
                                this.waitForVideoCompleteAndRotate();
                            }, 500); // Give video time to start playing
                        }
                    }
                },
                "+=0.1"
            );
    }


    updateProgressDots() {
        const progressDots = document.querySelectorAll('.progress-dot');
        progressDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    startAutoRotate() {
        this.waitForVideoCompleteAndRotate();
    }

    waitForVideoCompleteAndRotate() {
        if (this.isPaused || this.isTransitioning || !this.isVisible) {
            return;
        }

        if (!this.currentVideoElement) {
            this.scheduleNextRotation(this.autoRotateDelay);
            return;
        }

        // Set up video completion tracking
        this.setupVideoCompletionTracking();
    }

    setupVideoCompletionTracking() {
        const video = this.currentVideoElement;
        
        if (!video || video.readyState < 1) {
            this.scheduleNextRotation(this.autoRotateDelay);
            return;
        }

        // Clear any existing timeout
        if (this.videoCompleteTimeout) {
            clearTimeout(this.videoCompleteTimeout);
        }

        // Record when video started playing (or assume it's playing now)
        this.videoPlayStartTime = Date.now();
        this.waitingForVideoComplete = true;


        // Wait for video to complete one full cycle
        if (video.duration && !isNaN(video.duration)) {
            const videoDuration = Math.ceil(video.duration * 1000); // Convert to milliseconds
            const actualDelay = Math.max(videoDuration, 3000); // At least 3 seconds minimum
            
            this.scheduleNextRotation(actualDelay);
        } else {
            // Video duration not available, use fallback
            this.scheduleNextRotation(this.autoRotateDelay);
        }
    }

    scheduleNextRotation(delay) {
        // Clear existing timeout
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
        }

        
        this.autoRotateTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                if (!this.isPaused && !this.isTransitioning && this.isVisible) {
                    const nextIndex = (this.currentIndex + 1) % this.gamemodes.length;
                    this.goToGamemode(nextIndex);
                } else {
                }
            });
        }, delay);
    }

    pauseAutoRotate() {
        this.isPaused = true;
        this.waitingForVideoComplete = false;
        
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
            this.autoRotateTimeout = null;
        }
        
        if (this.videoCompleteTimeout) {
            clearTimeout(this.videoCompleteTimeout);
            this.videoCompleteTimeout = null;
        }
    }

    resumeAutoRotate() {
        if (!this.isPaused) return; // Already running
        
        this.isPaused = false;
        this.waitingForVideoComplete = false;
        
        // Restart video-duration-aware auto-rotation
        this.waitForVideoCompleteAndRotate();
    }

    stopAutoRotate() {
        this.isPaused = true;
        this.waitingForVideoComplete = false;
        
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
            this.autoRotateTimeout = null;
        }
        
        if (this.videoCompleteTimeout) {
            clearTimeout(this.videoCompleteTimeout);
            this.videoCompleteTimeout = null;
        }
    }

    setupScrollAnimations() {
        // Optimized ScrollTrigger animations using batched timelines for better performance
        if (typeof gsap === 'undefined' || !gsap.registerPlugin) return;
        
        gsap.registerPlugin(ScrollTrigger);
        
        // Use GSAP Manager for better memory management and cleanup
        const headerTimeline = window.GSAPManager ? 
            window.GSAPManager.createTimeline('gamemode-header-timeline', {
                scrollTrigger: {
                    trigger: '.gamemode-section',
                    start: 'top 80%',
                    end: 'top 20%',
                    toggleActions: 'play none none reverse',
                    once: true // Prevent re-triggering for better performance
                }
            }) :
            gsap.timeline({
                scrollTrigger: {
                    trigger: '.gamemode-section',
                    start: 'top 80%',
                    end: 'top 20%',
                    toggleActions: 'play none none reverse',
                    once: true,
                    id: 'gamemode-section-header'
                }
            });
        
        // Batch header animations
        headerTimeline
            .fromTo('.gamemode-main-title', 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
            )
            .fromTo('.gamemode-description', 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
                "-=0.6" // Overlap animations
            );
        
        // Use GSAP Manager for better memory management and cleanup
        const showcaseTimeline = window.GSAPManager ? 
            window.GSAPManager.createTimeline('gamemode-showcase-timeline', {
                scrollTrigger: {
                    trigger: '.gamemode-showcase',
                    start: 'top 80%',
                    end: 'top 20%',
                    toggleActions: 'play none none reverse',
                    once: true // Prevent re-triggering
                }
            }) :
            gsap.timeline({
                scrollTrigger: {
                    trigger: '.gamemode-showcase',
                    start: 'top 80%',
                    end: 'top 20%',
                    toggleActions: 'play none none reverse',
                    once: true,
                    id: 'gamemode-section-showcase'
                }
            });
        
        // Batch showcase animations
        showcaseTimeline
            .fromTo('.gamemode-title', 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
            )
            .fromTo('.gamemode-subtitle', 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
                "-=0.6"
            )
            .fromTo('.gamemode-video-container', 
                { y: 50, scale: 0.95 },
                { y: 0, scale: 1, duration: 1, ease: "power2.out" },
                "-=0.4"
            )
            .set('.gamemode-video', { opacity: 1 }, "-=0.8") // Ensure video is visible
            .fromTo('.gamemode-progress', 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
                "-=0.2"
            );

        // Initialize blood splatter reveal animation
        this.initGamemodeBloodsplatterReveal();
    }

    // Initialize sophisticated blood splatter reveal animation
    initGamemodeBloodsplatterReveal() {
        const splatterElement = document.querySelector('.bloodsplatter-decoration-header-center');
        const img = splatterElement?.querySelector('img');
        
        if (!img) return;

        // Configuration for gamemode header splatter
        const config = {
            centerX: 50, // Center position
            centerY: 50, // Center position
            duration: 0.8,
            delay: 0.3,
            ease: "power3.out"
        };

        // Create the reveal animation timeline
        const tl = gsap.timeline({ paused: true });

        // Get unique seed for this splatter
        const seed = this.getSplatterSeed('gamemode-header');
        
        // Initial state - completely hidden with noise pattern
        gsap.set(img, {
            clipPath: 'polygon(50% 50%)'
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
                if (typeof getPreCalculatedPath === 'function') {
                    const noisyPath = getPreCalculatedPath(adjustedProgress, config.centerX, config.centerY, seed);
                    img.style.clipPath = noisyPath;
                } else {
                    // Fallback to simple reveal if precalculated paths aren't available
                    const simpleRadius = Math.min(100, adjustedProgress);
                    img.style.clipPath = `circle(${simpleRadius}% at 50% 50%)`;
                }
            }
        });

        // Create ScrollTrigger for this splatter
        ScrollTrigger.create({
            trigger: '.gamemode-header',
            start: "top 80%",
            markers: false,
            onEnter: () => {
                gsap.delayedCall(config.delay, () => {
                    tl.play();
                    splatterElement.classList.add('bloodsplatter-revealed');
                });
            },
            id: 'bloodsplatter-gamemode-header'
        });
    }

    // Get unique seed for splatter type using existing system
    getSplatterSeed(splatterType) {
        // Use the existing getSplatterSeed function if available, otherwise fallback
        if (typeof getSplatterSeed !== 'undefined') {
            return getSplatterSeed(splatterType);
        }
        
        // Fallback seeds
        const seeds = {
            'gamemode-header': 12345,
            'bloodsplatter-decoration-header-center': 12345
        };
        return seeds[splatterType] || 12345;
    }

    // Method to initialize the first gamemode
    initializeFirstGamemode() {
        const gamemode = this.gamemodes[0];
        const titleElement = document.querySelector('.gamemode-title');
        const subtitleElement = document.querySelector('.gamemode-subtitle');

        if (titleElement && subtitleElement) {
            titleElement.textContent = gamemode.title;
            subtitleElement.textContent = gamemode.description;
            this.updateProgressDots();
        }
        
        // Video initialization is now handled by loadInitialVideo() called from initializeVideoPool()
    }

    // Enhanced cleanup method
    destroy() {
        this.stopAutoRotate();
        
        // Clean up section observer
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
            this.sectionObserver = null;
        }
        
        // Clean up memory monitoring
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
        }
        
        // Pause current video using global system
        if (this.currentVideoElement) {
            if (window.VideoLazyLoader && window.VideoLazyLoader.pauseVideo) {
                window.VideoLazyLoader.pauseVideo(this.currentVideoElement);
            } else {
                try {
                    this.currentVideoElement.pause();
                } catch (e) {
                    console.warn('Failed to pause video during cleanup:', e);
                }
            }
        }
        
        // Enhanced cleanup using GSAP Manager when available
        if (window.GSAPManager) {
            // Clean up managed timelines and ScrollTriggers
            const gamemodeAnimations = [
                'gamemode-header-timeline',
                'gamemode-showcase-timeline'
            ];
            
            gamemodeAnimations.forEach(id => {
                window.GSAPManager.killTimeline(id);
            });
            
            // Clean up bloodsplatter ScrollTrigger if managed
            window.GSAPManager.killScrollTrigger('bloodsplatter-gamemode-header');
            
            // Force refresh
            window.GSAPManager.refreshScrollTriggers(true);
        } else {
            // Fallback to manual cleanup
            if (typeof ScrollTrigger !== 'undefined') {
                const gamemodeScrollTriggers = [
                    'bloodsplatter-gamemode-header',
                    'gamemode-section-header',
                    'gamemode-section-showcase'
                ];
                
                gamemodeScrollTriggers.forEach(id => {
                    const trigger = ScrollTrigger.getById(id);
                    if (trigger) {
                        trigger.kill(true);
                    }
                });
                
                ScrollTrigger.getAll().forEach(trigger => {
                    if (trigger.trigger && trigger.trigger.closest('.gamemode-section')) {
                        trigger.kill(true);
                    }
                });
                
                ScrollTrigger.refresh();
            }
        }
        
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // Wait for VideoLazyLoader to be available for proper integration
    const initGamemodeSection = () => {
        const gamemodeSection = document.querySelector('.gamemode-section');
        
        if (gamemodeSection) {
            window.gamemodeSection = new GamemodeSection();
            window.gamemodeSection.initializeFirstGamemode();
        } else {
        }
    };
    
    // Check for VideoLazyLoader availability
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds max wait
    
    const waitForVideoLoader = () => {
        if (window.VideoLazyLoader || attempts >= maxAttempts) {
            initGamemodeSection();
        } else {
            attempts++;
            setTimeout(waitForVideoLoader, 100);
        }
    };
    
    // Start checking after other scripts have loaded
    setTimeout(waitForVideoLoader, 200);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.gamemodeSection) {
        window.gamemodeSection.destroy();
    }
});
