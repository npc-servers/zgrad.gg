document.addEventListener('DOMContentLoaded', function() {
    const gamemodes = [
        {
            title: "TROUBLE IN TERRORIST TOWN",
            description: "Classic TTT gameplay with enhanced mechanics. Trust no one as you navigate through deception, betrayal, and intense firefights.",
            video: "videos/background.webm"
        },
        {
            title: "MURDER",
            description: "One murderer, one sheriff, and innocent bystanders. Use stealth and strategy to survive in this psychological thriller gamemode.",
            video: "videos/background.webm"
        },
        {
            title: "ZOMBIE SURVIVAL",
            description: "Work together to survive waves of zombies. Build barricades, scavenge for supplies, and fight for your life in intense survival gameplay.",
            video: "videos/background.webm"
        },
        {
            title: "BATTLE ROYALE",
            description: "Last player standing wins. Scavenge for weapons and equipment while the play area shrinks. Pure survival of the fittest.",
            video: "videos/background.webm"
        }
    ];

    let currentGamemodeIndex = 0;
    let cycleInterval;
    let nextGamemodeTimeout;
    // Total animation timing: title flicker (1s) + display (1.2s) + blink-out (0.8s) + description (4s) + fade-out (0.6s) = ~7.6s
    
    // Function to calculate optimal font size for center title
    function calculateOptimalFontSize(text, containerWidth) {
        // Determine base size based on screen width for better responsiveness
        let baseSize = 6; // rem - default large size
        
        if (window.innerWidth <= 480) {
            baseSize = 3; // Mobile portrait
        } else if (window.innerWidth <= 989) {
            baseSize = 3.5; // Mobile landscape
        } else if (window.innerWidth <= 992) {
            baseSize = 4; // Small tablets
        } else if (window.innerWidth <= 1200) {
            baseSize = 5; // Medium tablets
        } else if (window.innerWidth <= 1400) {
            baseSize = 5.5; // Large tablets
        }
        
        const maxWidth = containerWidth * 0.85; // Scale when text exceeds 85% of container
        
        // Create a temporary element to measure text width accurately
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.visibility = 'hidden';
        tempElement.style.whiteSpace = 'nowrap';
        tempElement.style.fontSize = `${baseSize}rem`;
        tempElement.style.fontWeight = '800';
        tempElement.style.textTransform = 'uppercase';
        tempElement.style.letterSpacing = '2px';
        tempElement.textContent = text;
        
        document.body.appendChild(tempElement);
        const textWidth = tempElement.offsetWidth;
        document.body.removeChild(tempElement);
        
        // Always scale to fit within 85% of container if text is too long
        if (textWidth > maxWidth) {
            const scaleFactor = maxWidth / textWidth;
            const scaledSize = baseSize * scaleFactor;
            return Math.max(scaledSize, 1.2); // minimum 1.2rem for readability
        }
        
        return baseSize;
    }
    
    // Function to show center title with animation
    function showCenterTitle(title, description) {
        if (!gamemodeCenterTitle) return;
        
        // Calculate optimal font size
        const videoContainer = document.querySelector('.cycling-gamemode-video');
        const containerWidth = videoContainer ? videoContainer.offsetWidth : window.innerWidth;
        const optimalSize = calculateOptimalFontSize(title, containerWidth);
        
        // Update title and font size
        gamemodeCenterTitle.textContent = title;
        gamemodeCenterTitle.style.fontSize = `${optimalSize}rem`;
        
        // Hide description initially
        if (gamemodeDescription) {
            gamemodeDescription.style.opacity = '0';
            gamemodeDescription.style.transform = 'translateX(-50%) translateY(20px)';
        }
        
        // Reset any existing classes and styles
        gamemodeCenterTitle.classList.remove('flicker-in', 'blink-out');
        gamemodeCenterTitle.style.transition = '';
        gamemodeCenterTitle.style.opacity = '0';
        gamemodeCenterTitle.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Trigger flicker animation
        setTimeout(() => {
            gamemodeCenterTitle.classList.add('flicker-in');
        }, 50); // Small delay to ensure the reset takes effect
        
        // After flicker completes (1s) + display time (1.2s), start blink-out
        setTimeout(() => {
            gamemodeCenterTitle.classList.remove('flicker-in');
            gamemodeCenterTitle.classList.add('blink-out');
            
            // Show description after blink-out completes (0.8s)
            setTimeout(() => {
                showDescription(description);
            }, 800); // Wait for blink-out to complete
        }, 2200);
    }
    
    // Function to show description with animation
    function showDescription(description) {
        if (!gamemodeDescription) return;
        
        // Update description content
        gamemodeDescription.textContent = description;
        
        // Reset any existing classes and styles
        gamemodeDescription.classList.remove('wipe-in');
        gamemodeDescription.style.transition = '';
        gamemodeDescription.style.opacity = '1';
        gamemodeDescription.style.transform = 'translateX(-50%) translateY(0)';
        gamemodeDescription.style.clipPath = 'inset(0 100% 0 0)';
        
        // Trigger wipe animation
        setTimeout(() => {
            gamemodeDescription.classList.add('wipe-in');
        }, 50); // Small delay to ensure the reset takes effect
        
        // Hide description after 4 seconds
        setTimeout(() => {
            gamemodeDescription.classList.remove('wipe-in');
            gamemodeDescription.style.transition = 'opacity 0.6s ease-in-out, transform 0.6s ease-in-out, clip-path 0s';
            gamemodeDescription.style.opacity = '0';
            gamemodeDescription.style.transform = 'translateX(-50%) translateY(20px)';
            gamemodeDescription.style.clipPath = 'inset(0 100% 0 0)';
            
            // Trigger next gamemode immediately after description fade completes
            setTimeout(() => {
                if (cycleInterval) { // Only if cycling is active
                    const nextIndex = (currentGamemodeIndex + 1) % gamemodes.length;
                    updateGamemode(nextIndex);
                }
            }, 600); // Wait for fade out to complete
        }, 4000);
    }

    const gamemodeTitle = document.getElementById('gamemodeTitle');
    const gamemodeDescription = document.getElementById('gamemodeDescription');
    const gamemodeVideo = document.getElementById('gamemodeVideo');
    const gamemodeCenterTitle = document.getElementById('gamemodeCenterTitle');
    const navDots = document.querySelectorAll('.gamemode-nav-dot');

    function updateGamemode(index, animate = true) {
        if (index < 0 || index >= gamemodes.length) return;

        const gamemode = gamemodes[index];
        
        if (animate) {
            // Show center title and description animation sequence
            showCenterTitle(gamemode.title, gamemode.description);
            
            // Update video source if different
            const currentSrc = gamemodeVideo.querySelector('source').src;
            const newSrc = gamemode.video;
            if (!currentSrc.includes(newSrc)) {
                gamemodeVideo.querySelector('source').src = newSrc;
                gamemodeVideo.load();
            }
        } else {
            // Update without animation (initial load)
            gamemodeDescription.textContent = gamemode.description;
            gamemodeVideo.querySelector('source').src = gamemode.video;
            gamemodeVideo.load();
            gamemodeDescription.style.opacity = '0';
            gamemodeDescription.style.transform = 'translateX(-50%) translateY(20px)';
            gamemodeDescription.style.clipPath = 'inset(0 100% 0 0)';
            
            // Update center title for initial load
            if (gamemodeCenterTitle) {
                gamemodeCenterTitle.textContent = gamemode.title;
                const videoContainer = document.querySelector('.cycling-gamemode-video');
                const containerWidth = videoContainer ? videoContainer.offsetWidth : window.innerWidth;
                const optimalSize = calculateOptimalFontSize(gamemode.title, containerWidth);
                gamemodeCenterTitle.style.fontSize = `${optimalSize}rem`;
                gamemodeCenterTitle.style.opacity = '0';
            }
        }

        // Update navigation dots
        navDots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === index);
        });

        currentGamemodeIndex = index;
    }

    function startCycling() {
        // Clear any existing cycling first
        stopCycling();
        // Set cycling flag to true to allow automatic progression
        cycleInterval = true;
    }

    function stopCycling() {
        if (cycleInterval) {
            cycleInterval = null;
        }
        if (nextGamemodeTimeout) {
            clearTimeout(nextGamemodeTimeout);
            nextGamemodeTimeout = null;
        }
    }

    function restartCycling() {
        stopCycling();
        // Restart cycling immediately
        if (!document.hidden) { // Only restart if page is visible
            startCycling();
        }
    }

    // Initialize video and basic setup without animation first
    const initialGamemode = gamemodes[0];
    if (gamemodeVideo && gamemodeDescription) {
        gamemodeVideo.querySelector('source').src = initialGamemode.video;
        gamemodeVideo.load();
        gamemodeDescription.textContent = initialGamemode.description;
        gamemodeDescription.style.opacity = '0';
        gamemodeDescription.style.transform = 'translateX(-50%) translateY(20px)';
        gamemodeDescription.style.clipPath = 'inset(0 100% 0 0)';
    }
    if (gamemodeCenterTitle) {
        gamemodeCenterTitle.textContent = initialGamemode.title;
        gamemodeCenterTitle.style.opacity = '0';
    }
    
    // Set initial navigation dot state
    navDots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === 0);
    });
    
    // Initialize with first gamemode - show animation for the first one too
    setTimeout(() => {
        updateGamemode(0, true); // Use animation for initial display
    }, 1000); // Small delay to ensure everything is loaded

    // Ensure dots are visible (fallback for animation issues)
    navDots.forEach(dot => {
        dot.style.opacity = '1';
        dot.style.display = 'block';
    });

    // Add click handlers to navigation dots
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (index !== currentGamemodeIndex) {
                updateGamemode(index);
                restartCycling();
            }
        });
    });

    // Pause cycling on hover, resume on leave
    const videoContainer = document.querySelector('.cycling-gamemode-video');
    if (videoContainer) {
        videoContainer.addEventListener('mouseenter', stopCycling);
        videoContainer.addEventListener('mouseleave', startCycling);
    }

    // Start the automatic cycling
    startCycling();

    // Handle visibility change (pause when tab is not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopCycling();
        } else {
            startCycling();
        }
    });
    
    // Handle window resize for center title font size
    window.addEventListener('resize', () => {
        if (gamemodeCenterTitle && gamemodeCenterTitle.textContent) {
            const videoContainer = document.querySelector('.cycling-gamemode-video');
            const containerWidth = videoContainer ? videoContainer.offsetWidth : window.innerWidth;
            const optimalSize = calculateOptimalFontSize(gamemodeCenterTitle.textContent, containerWidth);
            gamemodeCenterTitle.style.fontSize = `${optimalSize}rem`;
        }
    });

    // GSAP animations for enhanced visual effects
    if (typeof gsap !== 'undefined') {
        // Animate navigation dots on load
        gsap.fromTo('.gamemode-nav-dot', 
            {
                opacity: 0,
                scale: 0
            },
            {
                duration: 0.6,
                opacity: 1,
                scale: 1,
                stagger: 0.1,
                ease: "back.out(1.7)",
                delay: 1
            }
        );

        // Animate video container on load
        gsap.from('.cycling-gamemode-video', {
            duration: 1.2,
            opacity: 0,
            y: 50,
            ease: "power3.out",
            delay: 0.5
        });

        // Keep the original updateGamemode function without GSAP override to avoid conflicts
    }
}); 