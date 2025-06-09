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
    const cycleDuration = 5000; // 5 seconds

    const gamemodeTitle = document.getElementById('gamemodeTitle');
    const gamemodeDescription = document.getElementById('gamemodeDescription');
    const gamemodeVideo = document.getElementById('gamemodeVideo');
    const navDots = document.querySelectorAll('.gamemode-nav-dot');

    function updateGamemode(index, animate = true) {
        if (index < 0 || index >= gamemodes.length) return;

        const gamemode = gamemodes[index];
        
        if (animate) {
            // Smooth fade transition
            gamemodeTitle.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            gamemodeDescription.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
            
            // Fade out current content
            gamemodeTitle.style.opacity = '0';
            gamemodeTitle.style.transform = 'translateY(-10px)';
            gamemodeDescription.style.opacity = '0';
            gamemodeDescription.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                // Update content
                gamemodeTitle.textContent = gamemode.title;
                gamemodeDescription.textContent = gamemode.description;
                
                // Update video source if different
                const currentSrc = gamemodeVideo.querySelector('source').src;
                const newSrc = gamemode.video;
                if (!currentSrc.includes(newSrc)) {
                    gamemodeVideo.querySelector('source').src = newSrc;
                    gamemodeVideo.load();
                }
                
                // Fade in new content
                setTimeout(() => {
                    gamemodeTitle.style.opacity = '1';
                    gamemodeTitle.style.transform = 'translateY(0)';
                    gamemodeDescription.style.opacity = '1';
                    gamemodeDescription.style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        } else {
            // Update without animation (initial load)
            gamemodeTitle.textContent = gamemode.title;
            gamemodeDescription.textContent = gamemode.description;
            gamemodeVideo.querySelector('source').src = gamemode.video;
            gamemodeVideo.load();
            gamemodeTitle.style.opacity = '1';
            gamemodeDescription.style.opacity = '1';
            gamemodeTitle.style.transform = 'translateY(0)';
            gamemodeDescription.style.transform = 'translateY(0)';
        }

        // Update navigation dots
        navDots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === index);
        });

        currentGamemodeIndex = index;
    }

    function startCycling() {
        // Clear any existing interval first
        stopCycling();
        cycleInterval = setInterval(() => {
            const nextIndex = (currentGamemodeIndex + 1) % gamemodes.length;
            updateGamemode(nextIndex);
        }, cycleDuration);
    }

    function stopCycling() {
        if (cycleInterval) {
            clearInterval(cycleInterval);
            cycleInterval = null;
        }
    }

    function restartCycling() {
        stopCycling();
        // Start cycling again after the current cycle duration
        setTimeout(() => {
            if (!document.hidden) { // Only restart if page is visible
                startCycling();
            }
        }, cycleDuration);
    }

    // Initialize with first gamemode
    updateGamemode(0, false);

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