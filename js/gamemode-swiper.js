// Gamemode Swiper - SwiperJS Integration for Gamemodes Section
// Integrates with existing video management and animation systems

document.addEventListener('DOMContentLoaded', function() {
    initGamemodeSwiper();
});

// Gamemode data structure
const gamemodeData = [
    {
        id: 'ttt-classic',
        title: 'TTT CLASSIC',
        subtitle: 'The original Trouble in Terrorist Town experience with enhanced physics and realistic damage systems.',
        videoSrc: 'videos/shooting.webm',
        features: ['Classic TTT Gameplay', 'Enhanced Physics', 'Realistic Damage', 'Detective Tools']
    },
    {
        id: 'medical-system',
        title: 'MEDICAL WARFARE',
        subtitle: 'Advanced medical mechanics add depth to survival gameplay with wound treatment and CPR systems.',
        videoSrc: 'videos/medical_demo1.webm',
        features: ['Wound Treatment', 'CPR System', 'Medical Equipment', 'Health Conditions']
    },
    {
        id: 'ragdoll-physics',
        title: 'RAGDOLL CLIMBING',
        subtitle: 'Experience unprecedented realism with advanced ragdoll physics and environmental interaction.',
        videoSrc: 'videos/climbing_demo1.webm',
        features: ['Ragdoll Physics', 'Environmental Interaction', 'Realistic Movement', 'Body Climbing']
    },
    {
        id: 'gore-system',
        title: 'GORE WARFARE',
        subtitle: 'Realistic gore and damage effects create intense, immersive combat experiences.',
        videoSrc: 'videos/gore_demo1.webm',
        features: ['Realistic Gore', 'Damage Effects', 'Visual Feedback', 'Immersive Combat']
    },
    {
        id: 'custom-weapons',
        title: 'CUSTOM ARSENAL',
        subtitle: 'Unique weapons with distinct mechanics offering different tactical advantages and playstyles.',
        videoSrc: 'videos/weapon_demo1.webm',
        features: ['Custom Weapons', 'Unique Mechanics', 'Tactical Advantages', 'Diverse Playstyles']
    },
    {
        id: 'class-system',
        title: 'CLASS WARFARE',
        subtitle: 'Specialized classes with unique abilities and equipment for strategic gameplay variety.',
        videoSrc: 'videos/classes_demo1.webm',
        features: ['Specialized Classes', 'Unique Abilities', 'Strategic Equipment', 'Varied Gameplay']
    }
];

let gamemodeSwiper = null;
let currentVideoElement = null;

function initGamemodeSwiper() {
    // Generate slides HTML
    generateSwiperSlides();
    
    // Initialize Swiper
    gamemodeSwiper = new Swiper('.gamemode-swiper', {
        // Basic settings
        slidesPerView: 1,
        spaceBetween: 30,
        centeredSlides: true,
        loop: true,
        speed: 800,
        
        // Auto height for responsive content
        autoHeight: false,
        
        // Responsive breakpoints
        breakpoints: {
            768: {
                slidesPerView: 1.2,
                spaceBetween: 40,
            },
            1024: {
                slidesPerView: 1.5,
                spaceBetween: 50,
            },
            1200: {
                slidesPerView: 1.8,
                spaceBetween: 60,
            }
        },
        
        // Navigation
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        
        // Pagination
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: false,
        },
        
        // Effects
        effect: 'slide',
        
        // Autoplay disabled to prevent infinite loops
        // autoplay: {
        //     delay: 5000,
        //     disableOnInteraction: true,
        //     pauseOnMouseEnter: true,
        // },
        
        // Lazy loading
        lazy: {
            loadPrevNext: true,
            loadPrevNextAmount: 2,
        },
        
        // Events
        on: {
            init: function() {
                console.log('🎮 Gamemode Swiper initialized');
                
                // Preload videos for initial visible slides
                preloadVisibleVideos(this);
                
                // Integrate with GSAP animations
                initSwiperAnimations();
            },
            
            slideChangeTransitionEnd: function() {
                // Only handle video changes after transition is complete
                console.log('✅ Slide transition ended');
                preloadVisibleVideos(this);
                handleSlideChange(this);
            },
            
            touchStart: function() {
                // Pause autoplay on touch
                if (this.autoplay) {
                    this.autoplay.stop();
                }
            },
            
            touchEnd: function() {
                // Resume autoplay after touch
                setTimeout(() => {
                    if (this.autoplay) {
                        this.autoplay.start();
                    }
                }, 3000);
            }
        }
    });
    
    // Setup video management
    setupVideoManagement();
    
    // Setup intersection observer for performance
    setupIntersectionObserver();
    
    // Initialize first video after a short delay
    setTimeout(() => {
        console.log('🚀 Initializing first video...');
        if (gamemodeSwiper && gamemodeSwiper.slides) {
            handleSlideChange(gamemodeSwiper);
        } else {
            console.warn('⚠️ Swiper or slides not found during initialization');
        }
    }, 1000);
}

function generateSwiperSlides() {
    const swiperWrapper = document.querySelector('.gamemode-swiper .swiper-wrapper');
    if (!swiperWrapper) return;
    
    const slidesHTML = gamemodeData.map(gamemode => `
        <div class="swiper-slide" data-gamemode="${gamemode.id}">
            <div class="gamemode-card">
                <div class="gamemode-video-container">
                    <video 
                        class="gamemode-video lazy-video" 
                        muted 
                        loop 
                        preload="metadata" 
                        data-src="${gamemode.videoSrc}"
                        playsinline
                    >
                        <source data-src="${gamemode.videoSrc}" type="video/webm">
                    </video>
                    <div class="gamemode-overlay">
                        <div class="gamemode-title">${gamemode.title}</div>
                        <div class="gamemode-subtitle">${gamemode.subtitle}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    swiperWrapper.innerHTML = slidesHTML;
}

function preloadVisibleVideos(swiper) {
    // Get all currently visible slides (active + adjacent)
    const visibleSlides = [];
    
    // Add active slide
    if (swiper.slides[swiper.activeIndex]) {
        visibleSlides.push(swiper.slides[swiper.activeIndex]);
    }
    
    // Add previous and next slides if they exist
    if (swiper.slides[swiper.activeIndex - 1]) {
        visibleSlides.push(swiper.slides[swiper.activeIndex - 1]);
    }
    if (swiper.slides[swiper.activeIndex + 1]) {
        visibleSlides.push(swiper.slides[swiper.activeIndex + 1]);
    }
    
    // For loop mode, also check wrapped slides
    if (swiper.params.loop) {
        const totalSlides = swiper.slides.length;
        // Check wrapped previous
        if (swiper.activeIndex === 0 && swiper.slides[totalSlides - 1]) {
            visibleSlides.push(swiper.slides[totalSlides - 1]);
        }
        // Check wrapped next
        if (swiper.activeIndex === totalSlides - 1 && swiper.slides[0]) {
            visibleSlides.push(swiper.slides[0]);
        }
    }
    
    // Load videos in visible slides
    visibleSlides.forEach(slide => {
        const video = slide.querySelector('.gamemode-video');
        if (video && video.dataset.src && !video.src) {
            loadVideo(video);
        }
    });
}

let lastActiveIndex = -1;

function handleSlideChange(swiper) {
    // Prevent handling the same slide multiple times
    if (swiper.activeIndex === lastActiveIndex) {
        return;
    }
    lastActiveIndex = swiper.activeIndex;
    
    const activeSlide = swiper.slides[swiper.activeIndex];
    const video = activeSlide?.querySelector('.gamemode-video');
    
    console.log('🔄 Slide changed to index:', swiper.activeIndex);
    console.log('📹 Active video element:', video);
    console.log('🎬 Video src:', video?.src || video?.dataset.src);
    
    // Pause all other videos first
    pauseAllVideos();
    
    if (video && video !== currentVideoElement) {
        // Load video if not already loaded
        if (!video.src && video.dataset.src) {
            console.log('📥 Loading video for slide change');
            loadVideo(video);
        }
        
        // Update current video reference
        currentVideoElement = video;
        
        // Play the active video with a small delay
        setTimeout(() => {
            console.log('🎯 Playing video after slide change');
            playVideo(video);
        }, 300);
    }
}

function pauseAllVideos() {
    // Pause all gamemode videos except the current one
    const allVideos = document.querySelectorAll('.gamemode-video');
    allVideos.forEach(video => {
        if (video !== currentVideoElement && (video.classList.contains('video-playing') || !video.paused)) {
            pauseVideo(video);
        }
    });
}

function loadVideo(video) {
    if (!video || !video.dataset.src) return;
    
    console.log('🔄 Loading gamemode video:', video.dataset.src);
    
    // Simple, direct loading approach
    video.classList.add('video-loading');
    
    const source = video.querySelector('source[data-src]');
    if (source && source.dataset.src) {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
    }
    
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
    video.preload = 'metadata';
    video.load();
    
    video.addEventListener('loadeddata', function() {
        video.classList.remove('video-loading');
        video.classList.add('video-loaded');
        console.log('✅ Video loaded and ready:', video.src);
    }, { once: true });
    
    video.addEventListener('error', function() {
        video.classList.remove('video-loading');
        video.classList.add('video-error');
        console.warn('❌ Failed to load gamemode video:', video.src);
    }, { once: true });
}

function playVideo(video) {
    if (!video || video.classList.contains('video-error')) return;
    
    console.log('🎬 Attempting to play video:', video.src || video.dataset.src);
    
    // Pause all other videos first
    const allVideos = document.querySelectorAll('.gamemode-video');
    allVideos.forEach(otherVideo => {
        if (otherVideo !== video && !otherVideo.paused) {
            console.log('⏸️ Pausing other video:', otherVideo.src);
            otherVideo.pause();
            otherVideo.classList.remove('video-playing');
        }
    });
    
    // Load video if not loaded
    if (!video.src && video.dataset.src) {
        console.log('📥 Loading video before playing');
        loadVideo(video);
        video.addEventListener('loadeddata', () => {
            playVideoDirectly(video);
        }, { once: true });
        return;
    }
    
    // Play directly if already loaded
    playVideoDirectly(video);
}

function playVideoDirectly(video) {
    if (!video) return;
    
    console.log('▶️ Playing video directly:', video.src, 'Ready state:', video.readyState);
    
    // Wait for video to be ready if needed
    if (video.readyState < 2) {
        console.log('⏳ Waiting for video to be ready...');
        video.addEventListener('loadeddata', () => {
            playVideoDirectly(video);
        }, { once: true });
        return;
    }
    
    try {
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    video.classList.add('video-playing');
                    currentVideoElement = video;
                    console.log('✅ Video playing successfully:', video.src);
                })
                .catch(error => {
                    console.warn('❌ Video play failed:', error);
                    // Try to enable autoplay by user interaction
                    if (error.name === 'NotAllowedError') {
                        console.log('🔇 Autoplay blocked, trying muted play...');
                        video.muted = true;
                        video.play().catch(e => console.warn('Muted play also failed:', e));
                    }
                });
        } else {
            video.classList.add('video-playing');
            currentVideoElement = video;
            console.log('✅ Video playing (no promise):', video.src);
        }
    } catch (error) {
        console.warn('❌ Video play error:', error);
    }
}

function pauseVideo(video) {
    if (!video) return;
    
    try {
        video.pause();
        video.classList.remove('video-playing');
        
        if (currentVideoElement === video) {
            currentVideoElement = null;
        }
    } catch (error) {
        console.warn('Video pause error:', error);
    }
}

function setupVideoManagement() {
    // Add click handlers to videos for manual testing
    const allVideos = document.querySelectorAll('.gamemode-video');
    allVideos.forEach(video => {
        video.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Video clicked, attempting to play:', video.src || video.dataset.src);
            playVideo(video);
        });
        
        video.addEventListener('loadeddata', function() {
            console.log('📊 Video loadeddata event:', video.src);
            if (video !== currentVideoElement) {
                pauseVideo(video);
            }
        });
    });
}

function setupIntersectionObserver() {
    const swiperContainer = document.querySelector('.gamemode-swiper');
    if (!swiperContainer) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Swiper is visible, allow autoplay
                console.log('🎮 Gamemode swiper entered viewport');
                if (gamemodeSwiper && gamemodeSwiper.autoplay) {
                    gamemodeSwiper.autoplay.start();
                }
                
                // Resume video playback for active slide
                setTimeout(() => {
                    if (gamemodeSwiper && gamemodeSwiper.slides) {
                        const activeSlide = gamemodeSwiper.slides[gamemodeSwiper.activeIndex];
                        const video = activeSlide?.querySelector('.gamemode-video');
                        if (video) {
                            console.log('▶️ Resuming video playback for visible swiper');
                            currentVideoElement = video; // Re-establish the current video
                            playVideo(video);
                        }
                    }
                }, 100);
            } else {
                // Swiper is not visible, pause autoplay and ALL gamemode videos
                console.log('🎮 Gamemode swiper left viewport - pausing all videos');
                if (gamemodeSwiper && gamemodeSwiper.autoplay) {
                    gamemodeSwiper.autoplay.stop();
                }
                
                // Pause all gamemode videos using the vanilla lazy load system
                pauseAllGamemodeVideos();
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '50px'
    });
    
    observer.observe(swiperContainer);
}

function pauseAllGamemodeVideos() {
    // Get all gamemode videos and pause them (for when swiper goes out of view)
    const allGamemodeVideos = document.querySelectorAll('.gamemode-video');
    
    allGamemodeVideos.forEach(video => {
        if (!video.paused) {
            console.log('⏸️ Pausing gamemode video (out of view):', video.src || video.dataset.src);
            pauseVideo(video);
        }
    });
    
    // Clear current video reference since swiper is out of view
    if (currentVideoElement) {
        currentVideoElement = null;
    }
}

function initSwiperAnimations() {
    // Integrate with existing GSAP animation system
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // Animate gamemode header reveal
        gsap.fromTo('.gamemode-main-title', 
            {
                opacity: 0,
                y: 60,
                scale: 0.9
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1.2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.gamemode-header',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate gamemode description reveal with delay
        gsap.fromTo('.gamemode-description', 
            {
                opacity: 0,
                y: 40
            },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                delay: 0.3,
                scrollTrigger: {
                    trigger: '.gamemode-header',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate swiper entrance (no reverse on scroll away)
        gsap.fromTo('.gamemode-swiper', 
            {
                opacity: 0,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                delay: 0.6,
                scrollTrigger: {
                    trigger: '.gamemode-header',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );

        // Animate red gradient background reveal with swiper
        gsap.fromTo('.gamemode-gradient-bg', 
            {
                opacity: 0
            },
            {
                opacity: 1,
                duration: 1.2,
                ease: 'power2.out',
                delay: 0.8,
                scrollTrigger: {
                    trigger: '.gamemode-header',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
        
        // Animate slide content on change
        if (gamemodeSwiper) {
            gamemodeSwiper.on('slideChangeTransitionStart', function() {
                const activeSlide = this.slides[this.activeIndex];
                const overlay = activeSlide?.querySelector('.gamemode-overlay');
                
                if (overlay) {
                    gsap.fromTo(overlay.children,
                        { opacity: 0, y: 30 },
                        { 
                            opacity: 1, 
                            y: 0, 
                            duration: 0.6,
                            stagger: 0.1,
                            ease: 'power2.out',
                            delay: 0.2
                        }
                    );
                }
            });
        }
    }
}

// Public API for external control
window.GamemodeSwiper = {
    getInstance: () => gamemodeSwiper,
    goToSlide: (index) => gamemodeSwiper?.slideTo(index),
    nextSlide: () => gamemodeSwiper?.slideNext(),
    prevSlide: () => gamemodeSwiper?.slidePrev(),
    pauseAutoplay: () => gamemodeSwiper?.autoplay?.stop(),
    resumeAutoplay: () => gamemodeSwiper?.autoplay?.start(),
    getCurrentSlide: () => gamemodeSwiper?.activeIndex,
    getTotalSlides: () => gamemodeSwiper?.slides?.length || 0,
    pauseAllVideos: () => pauseAllGamemodeVideos(),
    getCurrentVideo: () => currentVideoElement,
    playCurrentVideo: () => {
        if (currentVideoElement) {
            playVideo(currentVideoElement);
        }
    },
    // Debug methods
    getVideoStates: () => {
        const videos = document.querySelectorAll('.gamemode-video');
        const states = [];
        videos.forEach((video, index) => {
            states.push({
                index,
                src: video.src || video.dataset.src,
                paused: video.paused,
                hasVideoPlaying: video.classList.contains('video-playing'),
                readyState: video.readyState,
                isCurrentVideo: video === currentVideoElement
            });
        });
        return states;
    },
    testPause: () => {
        console.log('🧪 Testing pause function...');
        pauseAllGamemodeVideos();
        console.log('🧪 Video states after pause:', window.GamemodeSwiper.getVideoStates());
    },
    destroy: () => {
        if (gamemodeSwiper) {
            gamemodeSwiper.destroy(true, true);
            gamemodeSwiper = null;
        }
    }
};

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Page hidden - pausing all gamemode videos');
        // Pause all gamemode videos when page is hidden
        pauseAllGamemodeVideos();
        
        if (gamemodeSwiper && gamemodeSwiper.autoplay) {
            gamemodeSwiper.autoplay.stop();
        }
    } else {
        console.log('📱 Page visible - checking swiper visibility');
        // Only resume if swiper is actually visible
        const swiperContainer = document.querySelector('.gamemode-swiper');
        if (swiperContainer) {
            const rect = swiperContainer.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                console.log('📱 Swiper is visible - resuming autoplay and video');
                if (gamemodeSwiper && gamemodeSwiper.autoplay) {
                    gamemodeSwiper.autoplay.start();
                }
                
                // Resume current video if available
                if (gamemodeSwiper && gamemodeSwiper.slides) {
                    const activeSlide = gamemodeSwiper.slides[gamemodeSwiper.activeIndex];
                    const video = activeSlide?.querySelector('.gamemode-video');
                    if (video && video.paused) {
                        playVideo(video);
                    }
                }
            }
        }
    }
});
