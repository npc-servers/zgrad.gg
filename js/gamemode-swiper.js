// Gamemode Swiper - SwiperJS Integration for Gamemodes Section
// Integrates with existing video management and animation systems

document.addEventListener('DOMContentLoaded', function() {
    initGamemodeSwiper();
});

// Gamemode data structure
const gamemodeData = [
    {
        id: 'beast',
        title: 'BEAST',
        subtitle: 'Hunt or be hunted in this intense survival gamemode where one player becomes the ultimate predator.',
        videoSrc: 'images/placeholder.png',
        features: ['Asymmetric Gameplay', 'Hunter vs Prey', 'Survival Mechanics', 'Intense Action']
    },
    {
        id: 'css',
        title: 'CSS',
        subtitle: 'Classic Counter-Strike Source gameplay with enhanced physics and realistic weapon mechanics.',
        videoSrc: 'images/placeholder.png',
        features: ['Classic CSS Gameplay', 'Enhanced Physics', 'Realistic Weapons', 'Tactical Combat']
    },
    {
        id: 'hide-and-seek',
        title: 'HIDE AND SEEK',
        subtitle: 'The ultimate game of cat and mouse with unique hiding mechanics and seeker abilities.',
        videoSrc: 'images/placeholder.png',
        features: ['Stealth Gameplay', 'Unique Hiding Spots', 'Seeker Abilities', 'Creative Strategies']
    },
    {
        id: 'hl2dm',
        title: 'HL2DM',
        subtitle: 'Half-Life 2 Deathmatch with enhanced physics, gravity gun mechanics, and intense combat.',
        videoSrc: 'images/placeholder.png',
        features: ['HL2 Deathmatch', 'Gravity Gun', 'Physics Combat', 'Classic Maps']
    },
    {
        id: 'homicide',
        title: 'HOMICIDE',
        subtitle: 'A detective-style gamemode where players must solve murders and identify the killer.',
        videoSrc: 'images/placeholder.png',
        features: ['Detective Gameplay', 'Murder Mystery', 'Evidence Collection', 'Social Deduction']
    },
    {
        id: 'juggernaut',
        title: 'JUGGERNAUT',
        subtitle: 'One player becomes an unstoppable force while others work together to bring them down.',
        videoSrc: 'images/placeholder.png',
        features: ['Boss Battle', 'Team Coordination', 'Power Progression', 'Epic Confrontations']
    },
    {
        id: 'riot',
        title: 'RIOT',
        subtitle: 'Chaotic large-scale battles with riot gear, crowd control, and explosive action.',
        videoSrc: 'images/placeholder.png',
        features: ['Large Scale Battles', 'Riot Gear', 'Crowd Control', 'Explosive Action']
    },
    {
        id: 'brawl',
        title: 'BRAWL',
        subtitle: 'Close-quarters combat with melee weapons, fists, and brutal hand-to-hand fighting.',
        videoSrc: 'images/placeholder.png',
        features: ['Melee Combat', 'Hand-to-Hand', 'Brutal Fighting', 'Close Quarters']
    },
    {
        id: 'gravity-gun-tdm',
        title: 'GRAVITY GUN TDM',
        subtitle: 'Team deathmatch focused on gravity gun mechanics and physics-based combat.',
        videoSrc: 'images/placeholder.png',
        features: ['Gravity Gun Focus', 'Team Deathmatch', 'Physics Combat', 'Creative Kills']
    },
    {
        id: 'the-hidden',
        title: 'THE HIDDEN',
        subtitle: 'One player becomes an invisible predator while others hunt them down with special equipment.',
        videoSrc: 'images/placeholder.png',
        features: ['Invisible Predator', 'Special Equipment', 'Tense Atmosphere', 'Asymmetric Combat']
    },
    {
        id: 'zombie-survival',
        title: 'ZOMBIE SURVIVAL',
        subtitle: 'Fight for survival against waves of zombies with limited resources and teamwork.',
        videoSrc: 'images/placeholder.png',
        features: ['Zombie Waves', 'Resource Management', 'Team Survival', 'Progressive Difficulty']
    },
    {
        id: 'medieval-tdm',
        title: 'MEDIEVAL TDM',
        subtitle: 'Epic medieval warfare with swords, shields, and ancient combat mechanics.',
        videoSrc: 'images/placeholder.png',
        features: ['Medieval Weapons', 'Sword Combat', 'Shield Mechanics', 'Epic Battles']
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
                // Preload videos for initial visible slides
                preloadVisibleVideos(this);
                
                // Integrate with GSAP animations
                initSwiperAnimations();
            },
            
            slideChange: function() {
                // Handle video changes immediately when slide changes
                preloadVisibleVideos(this);
                handleSlideChange(this);
            },
            
            slideChangeTransitionEnd: function() {
                // Ensure video is playing after transition is complete
                const activeSlide = this.slides[this.activeIndex];
                const video = activeSlide?.querySelector('.gamemode-video');
                if (video && video.paused && currentVideoElement === video) {
                    setTimeout(() => playVideo(video), 100);
                }
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
    
    // Setup navigation click handlers for immediate video response
    setupNavigationHandlers();
    
    // Initialize first slide after a short delay (images don't need video initialization)
    setTimeout(() => {
        if (gamemodeSwiper && gamemodeSwiper.slides) {
            handleSlideChange(gamemodeSwiper);
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
                    <img 
                        class="gamemode-image" 
                        src="${gamemode.videoSrc}"
                        alt="${gamemode.title}"
                        loading="lazy"
                    >
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
    
    // Since we're using images instead of videos in the gamemode section,
    // we don't need to handle video playback
    if (!video) {
        currentVideoElement = null;
        return;
    }
    
    // Pause all other videos first
    pauseAllVideos();
    
    // Load video if not already loaded
    if (!video.src && video.dataset.src) {
        loadVideo(video);
        
        // Wait for video to load before playing
        video.addEventListener('loadeddata', function() {
            currentVideoElement = video;
            playVideo(video);
        }, { once: true });
    } else {
        // Video is already loaded, play immediately
        currentVideoElement = video;
        
        // Play the active video with a small delay to ensure smooth transition
        setTimeout(() => {
            playVideo(video);
        }, 200);
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
    }, { once: true });
    
    video.addEventListener('error', function() {
        video.classList.remove('video-loading');
        video.classList.add('video-error');
        console.warn('Failed to load gamemode video:', video.src);
    }, { once: true });
}

function playVideo(video) {
    if (!video || video.classList.contains('video-error')) return;
    
    // Pause all other videos first
    const allVideos = document.querySelectorAll('.gamemode-video');
    allVideos.forEach(otherVideo => {
        if (otherVideo !== video && !otherVideo.paused) {
            otherVideo.pause();
            otherVideo.classList.remove('video-playing');
        }
    });
    
    // Load video if not loaded
    if (!video.src && video.dataset.src) {
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
    
    // Wait for video to be ready if needed
    if (video.readyState < 2) {
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
                })
                .catch(error => {
                    // Try to enable autoplay by user interaction
                    if (error.name === 'NotAllowedError') {
                        video.muted = true;
                        video.play().catch(e => console.warn('Video autoplay blocked:', e));
                    } else {
                        console.warn('Video play failed:', error);
                    }
                });
        } else {
            video.classList.add('video-playing');
            currentVideoElement = video;
        }
    } catch (error) {
        console.warn('Video play error:', error);
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
    // Add click handlers to videos for manual interaction
    const allVideos = document.querySelectorAll('.gamemode-video');
    allVideos.forEach(video => {
        video.addEventListener('click', function(e) {
            e.preventDefault();
            playVideo(video);
        });
        
        video.addEventListener('loadeddata', function() {
            if (video !== currentVideoElement) {
                pauseVideo(video);
            }
        });
    });
}

function setupNavigationHandlers() {
    // Add click handlers to navigation buttons and pagination for immediate video response
    const nextButton = document.querySelector('.gamemode-swiper .swiper-button-next');
    const prevButton = document.querySelector('.gamemode-swiper .swiper-button-prev');
    const pagination = document.querySelector('.gamemode-swiper .swiper-pagination');
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Force immediate slide change handling after a short delay
            setTimeout(() => {
                if (gamemodeSwiper) {
                    handleSlideChange(gamemodeSwiper);
                }
            }, 100);
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            // Force immediate slide change handling after a short delay
            setTimeout(() => {
                if (gamemodeSwiper) {
                    handleSlideChange(gamemodeSwiper);
                }
            }, 100);
        });
    }
    
    if (pagination) {
        pagination.addEventListener('click', function(e) {
            // Check if clicked element is a pagination bullet
            if (e.target.classList.contains('swiper-pagination-bullet')) {
                // Force immediate slide change handling after a short delay
                setTimeout(() => {
                    if (gamemodeSwiper) {
                        handleSlideChange(gamemodeSwiper);
                    }
                }, 100);
            }
        });
    }
}

function setupIntersectionObserver() {
    const swiperContainer = document.querySelector('.gamemode-swiper');
    if (!swiperContainer) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Swiper is visible, allow autoplay
                if (gamemodeSwiper && gamemodeSwiper.autoplay) {
                    gamemodeSwiper.autoplay.start();
                }
                
                // Resume video playback for active slide
                setTimeout(() => {
                    if (gamemodeSwiper && gamemodeSwiper.slides) {
                        const activeSlide = gamemodeSwiper.slides[gamemodeSwiper.activeIndex];
                        const video = activeSlide?.querySelector('.gamemode-video');
                        if (video) {
                            currentVideoElement = video; // Re-establish the current video
                            playVideo(video);
                        }
                    }
                }, 100);
            } else {
                // Swiper is not visible, pause autoplay and ALL gamemode videos
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
        // Pause all gamemode videos when page is hidden
        pauseAllGamemodeVideos();
        
        if (gamemodeSwiper && gamemodeSwiper.autoplay) {
            gamemodeSwiper.autoplay.stop();
        }
    } else {
        // Only resume if swiper is actually visible
        const swiperContainer = document.querySelector('.gamemode-swiper');
        if (swiperContainer) {
            const rect = swiperContainer.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
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
