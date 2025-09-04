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
        this.autoRotateDelay = 6000; // 6 seconds
        this.isPaused = false;
        this.currentVideoElement = null;
        this.sectionObserver = null;
        this.memoryMonitorInterval = null;
        this.isVisible = false;
        
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

        console.log('Working with existing video element structure');

        // Instead of creating a pool, we'll update the existing video's source
        // This maintains compatibility with the global VideoLazyLoader system
        this.currentVideoElement = existingVideo;
        
        // Set up the initial video
        this.updateVideoSource(0);
        
        // Ensure initial video is fully visible and remove any fade classes
        this.currentVideoElement.style.opacity = '1';
        this.currentVideoElement.classList.remove('fade-out');
        this.currentVideoElement.classList.add('fade-in');
        
        console.log('Video system initialized with existing HTML structure');
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

        console.log(`Updating video source to: ${gamemode.video}`);

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
        
        console.log(`Video source updated and reloaded: ${gamemode.video}`);
    }

    loadInitialVideo() {
        if (!this.currentVideoElement) {
            console.error('No current video element available');
            return;
        }

        console.log('Loading initial gamemode video with Vanilla-LazyLoad...');
        
        // Ensure video is visible from the start
        this.currentVideoElement.style.opacity = '1';
        this.currentVideoElement.classList.remove('fade-out');
        this.currentVideoElement.classList.add('fade-in');
        
        // Use the enhanced VideoLazyLoader system (now powered by Vanilla-LazyLoad)
        if (window.VideoLazyLoader && window.VideoLazyLoader.forceLoadVideo) {
            console.log('Using Enhanced Video Manager with Vanilla-LazyLoad');
            window.VideoLazyLoader.forceLoadVideo(this.currentVideoElement);
            
            // The system will automatically handle playing when ready and visible
            console.log('Video loading initiated through Enhanced Video Manager');
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
        
        console.log('Attempting to play video directly:', video.getAttribute('data-gamemode-index'));
        
        const source = video.querySelector('source');
        if (source && source.dataset.src) {
            console.log('Setting video src:', source.dataset.src);
            
            // Set the actual src
            source.src = source.dataset.src;
            video.src = source.dataset.src; // Also set on video element directly
            
            // Add error handling
            video.addEventListener('error', (e) => {
                console.error('Video error:', e, 'Video src:', video.src);
            }, { once: true });
            
            // Add loading progress
            video.addEventListener('loadstart', () => {
                console.log('Video started loading');
            }, { once: true });
            
            video.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded');
            }, { once: true });
            
            // Try to play when loaded
            video.addEventListener('loadeddata', () => {
                console.log('Video data loaded, attempting to play');
                video.play().then(() => {
                    console.log('✅ Video playing successfully!');
                }).catch(error => {
                    console.warn('❌ Video autoplay failed:', error);
                    console.log('Video element:', video);
                    console.log('Video readyState:', video.readyState);
                    console.log('Video networkState:', video.networkState);
                });
            }, { once: true });
            
            // Start loading
            video.load();
        } else {
            console.error('No source element or data-src found on video');
            console.log('Video element:', video);
            console.log('Source element:', source);
        }
    }

    setupSectionVisibilityObserver() {
        // Observer to track when gamemode section is visible for auto-rotation optimization
        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (entry.isIntersecting) {
                    this.resumeAutoRotate();
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
        console.log('High memory usage detected, optimizing gamemode section');
        
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
        console.log('Found progress dots:', progressDots.length);
        progressDots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                console.log('Progress dot clicked:', index);
                e.preventDefault();
                e.stopPropagation();
                if (!this.isTransitioning) {
                    this.goToGamemode(index);
                } else {
                    console.log('Transition in progress, ignoring click');
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
        console.log('goToGamemode called with index:', index, 'currentIndex:', this.currentIndex, 'isTransitioning:', this.isTransitioning);
        
        if (index === this.currentIndex) {
            console.log('Same index, ignoring');
            return;
        }
        
        if (this.isTransitioning) {
            console.log('Already transitioning, ignoring');
            return;
        }

        this.isTransitioning = true;
        const gamemode = this.gamemodes[index];
        console.log('Switching to gamemode:', gamemode.title);
        
        // Update content with fade transition
        this.updateContent(gamemode, () => {
            this.currentIndex = index;
            this.updateProgressDots();
            this.isTransitioning = false;
            console.log('Gamemode transition completed');
        });
    }

    updateContent(gamemode, callback) {
        const titleElement = document.querySelector('.gamemode-title');
        const subtitleElement = document.querySelector('.gamemode-subtitle');

        if (!titleElement || !subtitleElement || !this.currentVideoElement) return;

        const newIndex = this.gamemodes.indexOf(gamemode);
        
        // Fade out current content
        const elementsToFade = [titleElement, subtitleElement];
        
        // Animate text and video elements out
        gsap.to(elementsToFade, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: "power2.out"
        });

        gsap.to(this.currentVideoElement, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
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
                        console.log('✅ New gamemode video playing successfully');
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
                
                // Fade in video
                gsap.to(this.currentVideoElement, {
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out",
                    delay: 0.1
                });
                
                // Animate text elements in
                gsap.fromTo(elementsToFade, 
                    { opacity: 0, y: 20 },
                    { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.4, 
                        ease: "power2.out",
                        delay: 0.2,
                        onComplete: callback
                    }
                );
            }
        });
    }


    updateProgressDots() {
        const progressDots = document.querySelectorAll('.progress-dot');
        progressDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    startAutoRotate() {
        // Optimized auto-rotation using requestAnimationFrame for better performance
        const autoRotateLoop = () => {
            if (!this.isPaused && !this.isTransitioning && this.isVisible) {
                const nextIndex = (this.currentIndex + 1) % this.gamemodes.length;
                this.goToGamemode(nextIndex);
            }
            
            // Schedule next rotation only if not paused
            if (!this.isPaused) {
                this.autoRotateTimeout = setTimeout(() => {
                    requestAnimationFrame(autoRotateLoop);
                }, this.autoRotateDelay);
            }
        };
        
        // Start the loop
        this.autoRotateTimeout = setTimeout(() => {
            requestAnimationFrame(autoRotateLoop);
        }, this.autoRotateDelay);
    }

    pauseAutoRotate() {
        this.isPaused = true;
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
            this.autoRotateTimeout = null;
        }
    }

    resumeAutoRotate() {
        if (!this.isPaused) return; // Already running
        
        this.isPaused = false;
        
        // Restart auto-rotation
        const autoRotateLoop = () => {
            if (!this.isPaused && !this.isTransitioning && this.isVisible) {
                const nextIndex = (this.currentIndex + 1) % this.gamemodes.length;
                this.goToGamemode(nextIndex);
            }
            
            if (!this.isPaused) {
                this.autoRotateTimeout = setTimeout(() => {
                    requestAnimationFrame(autoRotateLoop);
                }, this.autoRotateDelay);
            }
        };
        
        this.autoRotateTimeout = setTimeout(() => {
            requestAnimationFrame(autoRotateLoop);
        }, this.autoRotateDelay);
    }

    stopAutoRotate() {
        this.isPaused = true;
        if (this.autoRotateTimeout) {
            clearTimeout(this.autoRotateTimeout);
            this.autoRotateTimeout = null;
        }
    }

    setupScrollAnimations() {
        // Optimized ScrollTrigger animations using batched timelines for better performance
        if (typeof gsap === 'undefined' || !gsap.registerPlugin) return;
        
        gsap.registerPlugin(ScrollTrigger);
        
        // Create master timeline for header animations
        const headerTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.gamemode-section',
                start: 'top 80%',
                end: 'top 20%',
                toggleActions: 'play none none reverse',
                once: true // Prevent re-triggering for better performance
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
        
        // Create master timeline for showcase animations
        const showcaseTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.gamemode-showcase',
                start: 'top 80%',
                end: 'top 20%',
                toggleActions: 'play none none reverse',
                once: true // Prevent re-triggering
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
            console.log('Initial gamemode text initialized');
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
        
        // Clean up ScrollTrigger instances
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.trigger && trigger.trigger.closest('.gamemode-section')) {
                    trigger.kill();
                }
            });
        }
        
        console.log('Gamemode section cleaned up');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing gamemode section...');
    
    // Wait for VideoLazyLoader to be available for proper integration
    const initGamemodeSection = () => {
        const gamemodeSection = document.querySelector('.gamemode-section');
        console.log('Gamemode section found:', !!gamemodeSection);
        
        if (gamemodeSection) {
            console.log('Creating GamemodeSection instance...');
            window.gamemodeSection = new GamemodeSection();
            window.gamemodeSection.initializeFirstGamemode();
            console.log('GamemodeSection initialized');
        } else {
            console.log('No gamemode section found in DOM');
        }
    };
    
    // Check for VideoLazyLoader availability
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds max wait
    
    const waitForVideoLoader = () => {
        if (window.VideoLazyLoader || attempts >= maxAttempts) {
            console.log('VideoLazyLoader ready:', !!window.VideoLazyLoader);
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
