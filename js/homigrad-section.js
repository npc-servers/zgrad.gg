// Homigrad Section - Consolidated JavaScript for features, gamemodes, and homepage functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize any global functionality here
    
    // Force backdrop-filter rendering for feature items
    const featureItems = document.querySelectorAll('.feature-item');
    if (featureItems.length > 0) {
        // Force browser to render backdrop-filter immediately
        featureItems.forEach(item => {
            item.style.transform = 'translateZ(0)';
            // Trigger a repaint to ensure backdrop-filter is applied
            item.offsetHeight;
        });
    }
    
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

    // Add animation to the landing text
    const landingText = document.querySelector('.landing-text');
    if (landingText) {
        landingText.style.opacity = '0';
        landingText.style.transform = 'translateY(20px)';
        landingText.style.transition = 'opacity 1s ease, transform 1s ease';
        
        setTimeout(() => {
            landingText.style.opacity = '1';
            landingText.style.transform = 'translateY(0)';
        }, 500);
    }
    
    // Add animation to the logo
    const logo = document.querySelector('.main-logo');
    if (logo) {
        logo.style.opacity = '0';
        logo.style.transform = 'translateX(-20px)';
        logo.style.transition = 'opacity 1s ease, transform 1s ease';
        
        setTimeout(() => {
            logo.style.opacity = '1';
            logo.style.transform = 'translateX(0)';
        }, 200);
    }
    
    // Add animation to the CTA elements
    const ctaContainer = document.querySelector('.cta-container');
    if (ctaContainer) {
        // Hide the container initially
        ctaContainer.style.opacity = '0';
        
        // Animate each element separately for a sequential effect
        const ctaBox = document.querySelector('.cta-box');
        const ctaButton = document.querySelector('.cta-button');
        
        if (ctaBox) {
            ctaBox.style.transform = 'translateX(50px)';
            ctaBox.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            ctaBox.style.opacity = '0';
        }
        
        if (ctaButton) {
            ctaButton.style.transform = 'translateX(70px)';
            ctaButton.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            ctaButton.style.opacity = '0';
        }
        
        // Show the container
        setTimeout(() => {
            ctaContainer.style.opacity = '1';
            
            // Animate the box first
            if (ctaBox) {
                setTimeout(() => {
                    ctaBox.style.opacity = '1';
                    ctaBox.style.transform = 'translateX(0)';
                }, 100);
            }
            
            // Then animate the button
            if (ctaButton) {
                setTimeout(() => {
                    ctaButton.style.opacity = '1';
                    ctaButton.style.transform = 'translateX(0)';
                }, 300);
            }
        }, 800);
    }
    
    // Add animation to the side buttons (Discord and Store)
    const sideButtonsContainer = document.querySelector('.side-buttons-container');
    if (sideButtonsContainer) {
        // Hide the container initially
        sideButtonsContainer.style.opacity = '0';
        
        // Get the buttons
        const buttons = sideButtonsContainer.querySelectorAll('.side-button');
        
        // Set initial states for each button
        buttons.forEach(button => {
            button.style.transform = 'translateX(-50px)';
            button.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            button.style.opacity = '0';
        });
        
        // Show the container with a delay similar to CTA
        setTimeout(() => {
            sideButtonsContainer.style.opacity = '1';
            
            // Animate each button with a slight delay between them
            buttons.forEach((button, index) => {
                setTimeout(() => {
                    button.style.opacity = '1';
                    button.style.transform = 'translateX(0)';
                }, 100 + (index * 200)); // 100ms base delay + 200ms per button
            });
        }, 800);
    }
    
    // Animate the scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        // Show the scroll indicator last
        setTimeout(() => {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.transform = 'translateY(0)';
        }, 1500);
        
        // Add scroll event listener to hide the indicator when user scrolls down
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.transform = 'translateY(20px)';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.transform = 'translateY(0)';
            }
        });
    }

    // Server data
    const servers = [
        {
            id: 'zgrad1',
            ip: '193.243.190.18',
            port: 27066
        },
        {
            id: 'zgrad2',
            ip: '193.243.190.18',
            port: 27051
        },
        {
            id: 'zgrad3',
            ip: '193.243.190.18',
            port: 27053
        },
        {
            id: 'zgrad4',
            ip: '193.243.190.18',
            port: 27052
        }
    ];

    async function updateTotalPlayers() {
        const totalPlayersElement = document.getElementById('totalPlayers');
        if (!totalPlayersElement) return;

        try {
            // Fetch all server statuses in parallel
            const promises = servers.map(server => 
                fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`)
                    .then(response => response.json())
                    .catch(() => ({ players: 0, maxplayers: 0 })) // Handle failed requests gracefully
            );

            const results = await Promise.all(promises);
            
            // Calculate total players and max players
            const totals = results.reduce((acc, result) => {
                const players = result.players || result.num_players || result.playercount || 0;
                const maxPlayers = result.maxplayers || result.max_players || result.maxclients || 0;
                return {
                    current: acc.current + players,
                    max: acc.max + maxPlayers
                };
            }, { current: 0, max: 0 });

            // Get current displayed value
            const currentDisplay = totalPlayersElement.textContent;
            const [oldCurrent] = currentDisplay.split('/').map(n => parseInt(n) || 0);
            
            // Immediately show max players
            totalPlayersElement.textContent = `${oldCurrent}/${totals.max}`;
            
            // Animate current players count
            if (oldCurrent !== totals.current) {
                const duration = 1000; // 1 second animation
                const startTime = performance.now();
                const startValue = oldCurrent;
                const endValue = totals.current;
                
                function animate(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function for smooth counting
                    const easeOutQuad = t => t * (2 - t);
                    const easedProgress = easeOutQuad(progress);
                    
                    const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
                    totalPlayersElement.textContent = `${currentValue}/${totals.max}`;
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                }
                
                requestAnimationFrame(animate);
            }
        } catch (error) {
            console.error('Error updating player count:', error);
        }
    }

    // Update immediately and then every 30 seconds
    updateTotalPlayers();
    setInterval(updateTotalPlayers, 30000);

    // ===== GAMEMODES SCROLL FUNCTIONALITY =====
    const gamemodes = [
        'Homicide',
        'Wild West',
        'Zombie Survival',
        'Team Deathmatch',
        'Cops and Robbers',
        'State of Emergency',
        'War on Terror',
        'The Hidden',
        'Hide and Seek',
        'Juggernaut',
        'Capture the Flag',
        'The Beast'
    ];
    
    const scrollContent = document.getElementById('gamemodes-scroll-content');
    let isPaused = false;
    
    // Create initial gamemode elements - we'll create 4 sets for more reliability
    function createGamemodeElements() {
        if (!scrollContent) return;
        
        for (let i = 0; i < 4; i++) {
            gamemodes.forEach(gamemode => {
                const gamemodeElement = document.createElement('div');
                gamemodeElement.classList.add('gamemode-item');
                gamemodeElement.textContent = gamemode;
                
                // Add hover event listeners
                gamemodeElement.addEventListener('mouseenter', () => {
                    isPaused = true;
                    scrollContent.classList.add('paused');
                });
                
                gamemodeElement.addEventListener('mouseleave', () => {
                    isPaused = false;
                    scrollContent.classList.remove('paused');
                });
                
                scrollContent.appendChild(gamemodeElement);
            });
        }
    }
    
    createGamemodeElements();
    
    // Calculate the height of a single set of gamemodes
    if (scrollContent && scrollContent.children.length > 0) {
        const singleSetHeight = gamemodes.reduce((height, _, index) => {
            const element = scrollContent.children[index];
            return height + element.offsetHeight + parseInt(getComputedStyle(element).marginBottom, 10);
        }, 0);
        
        let currentPosition = 0;
        const scrollSpeed = 0.5; // pixels per frame
        
        // Animation function
        function animateScroll() {
            if (!isPaused) {
                currentPosition -= scrollSpeed;
                
                // When we've scrolled past a complete set, reset position precisely
                if (Math.abs(currentPosition) >= singleSetHeight) {
                    // Add exactly one set height to reset position to create seamless loop
                    currentPosition += singleSetHeight;
                }
                
                scrollContent.style.transform = `translateY(${currentPosition}px)`;
            }
            requestAnimationFrame(animateScroll);
        }
        
        // Start the animation
        requestAnimationFrame(animateScroll);
    }

    // ===== FEATURES SECTION FUNCTIONALITY =====
    // Features data array with all the necessary information
    const featuresData = [
        {
            title: "Realistic Physics",
            description: "Throw, break and pick up objects, get crushed by heavy objects, and use your body as a weapon.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M7 17v-2h6q-.35-.425-.562-.925T12.1 13H9v-2h3.1q.125-.575.338-1.075T13 9H3V7h14q2.075 0 3.538 1.463T22 12t-1.463 3.538T17 17zm10-2q1.25 0 2.125-.875T20 12t-.875-2.125T17 9t-2.125.875T14 12t.875 2.125T17 15M2 13v-2h6v2zm1 4v-2h3v2z"/></svg>`
        },
        {
            title: "Realistic Health System",
            description: "Break and fracture bones, bleed out from wounds, and get knocked unconscious.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Mage Icons by MageIcons - https://github.com/Mage-Icons/mage-icons/blob/main/License.txt --><path fill="currentColor" d="M20.13 4.155a5 5 0 0 0-4.39-1.07A6 6 0 0 0 12 5.665a6 6 0 0 0-3.72-2.58a5.09 5.09 0 0 0-4.4 1c-1.58 1.38-2.45 4.44-1.46 7.54q.168.514.4 1q.06.113.11.23c2.57 5.24 8.51 8 8.77 8.13a.7.7 0 0 0 .31.07a.7.7 0 0 0 .31-.07c.25-.11 6.25-2.85 8.8-8.15l.08-.17q.237-.51.41-1.05c.94-3 .08-6.06-1.48-7.46m-.31 7.93q-.21.471-.48.91h-3.31a1 1 0 0 1-.83-.45l-1.05-1.56l-2.23 4.46a1 1 0 0 1-.73.54h-.16a1 1 0 0 1-.71-.3l-2.71-2.7H4.7q-.276-.486-.5-1a6.3 6.3 0 0 1-.38-1h4.21a1 1 0 0 1 .71.29l2 2l2.38-4.76a1 1 0 0 1 .84-.55a1 1 0 0 1 .89.44l1.7 2.56h3.7q-.164.58-.43 1.12"/></svg>`
        },
        {
            title: "Ragdoll Climbing",
            description: "Use your hands to hold on to any surface or player, and climb up anywhere you want.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m13.5 22.5l-2-.4l.8-4.3l-3.6-2.7l-1.3-5.7l-2.2 1.9l.8 3.8l-2 .4l-1-4.9l4.45-3.975q.575-.5 1.363-.412t1.512.387q.8.35 1.663.5t1.737.025t1.613-.575t1.412-1L18 7.1q-.75.575-1.55 1.075t-1.725.775q-.825.225-1.662.238T11.4 9l.7 3.1l3.7-.7l5.2 3.7l-1.2 1.6l-4.3-3l-3.6.7l2.7 2zM8 5.5q-.825 0-1.412-.587T6 3.5t.588-1.412T8 1.5t1.413.588T10 3.5t-.587 1.413T8 5.5"/></svg>`
        },
        {
            title: "Custom Weapons",
            description: "Unique arsenal designed specifically for Homigrad with balanced gameplay mechanics.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><!-- Icon from Game Icons by GameIcons - https://github.com/game-icons/icons/blob/master/license.txt --><path fill="currentColor" d="M472.133 19.812L162.52 197.03l21.996 34.133L483.97 38.183zm-71.897 93.748l-117.627 75.8l16.35 10.41c45.98-32.88 82.61-61.844 100.483-82.544zm-134.283 86.535l-100.125 64.523l20.48 12.13c34.023-22.565 66.99-44.805 96.788-65.74zm-118.826 6.277l-6.227 4.012c-6.594 19.98-1.4 36.31 7.81 43.852l20.677-13.323zm-23.71 42.045c-5.512 5.532-12.928 13.198-22.288 23.64c-17.225 19.212-36.353 43.545-43.47 60.405c-18.543 43.928-15.34 97.99-18 147.736c2.41 7.08 5.408 9.92 8.197 11.137c2.96 1.292 6.896 1.194 11.74-.824c9.393-3.91 19.696-15.595 22.262-25.282c-.174-2.232-.92-12.117-1.237-25.643c-.356-15.14-.246-33.002 2.63-46.297c5.15-23.82 13.395-49.19 30.268-69.05c10.193-11.993 27.132-22.48 41.92-30.848c4.68-2.65 8.665-4.724 12.415-6.65c-19.88-12.29-36.656-17.7-44.437-38.323zm-57.75 37.793l-37.638 9.64L43.6 320.01c5.432-11.014 13.33-22.587 22.064-33.8zm125.86 8.82l-1.154.532s-6.765 3.116-16.096 8.043c-.25 10.99-5.59 19.736-12.617 25.5c-5.492 4.505-12.02 6.843-17.803 6.695c-4.355-.112-8.346-1.367-12.013-4.55c-1.8 1.62-3.36 3.18-4.606 4.644c-2.444 2.876-4.69 5.96-6.77 9.197c6.78 5.595 14.91 8.5 22.928 8.704c10.763.276 21.213-3.827 29.68-10.773c12.754-10.462 20.973-28.17 18.45-47.99z"/></svg>`
        },
        {
            title: "Regular Updates",
            description: "Constantly evolving content and mechanics keep the gameplay fresh and exciting.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M4.25 18.3q-.95-1.125-1.525-2.475T2 13h2.05q.15 1.075.55 2.063T5.65 16.9zM2 11q.2-1.475.75-2.825T4.25 5.7l1.4 1.4Q5 7.95 4.6 8.938T4.05 11zm8.95 10.95q-1.475-.15-2.812-.712T5.65 19.75l1.4-1.45q.875.65 1.85 1.075t2.05.575zM7.1 5.7L5.65 4.25q1.175-.925 2.525-1.488T11 2.05v2q-1.075.15-2.062.575T7.1 5.7m5.85 16.25v-2q1.1-.15 2.088-.562T16.9 18.3l1.45 1.45q-1.175.95-2.537 1.5t-2.863.7m4-16.25q-.875-.65-1.875-1.075T13 4.05v-2q1.475.15 2.838.713T18.35 4.25zm2.8 12.6l-1.4-1.4q.65-.85 1.05-1.837T19.95 13H22q-.2 1.475-.75 2.825t-1.5 2.475m.2-7.3q-.15-1.075-.55-2.062T18.35 7.1l1.4-1.4q.95 1.125 1.525 2.475T22 11zm-8.925 6v-6.175l-2.6 2.6L7.025 12l5-5l5 5l-1.425 1.4l-2.575-2.575V17z"/></svg>`
        },
        // Additional features can be easily added here
        {
            title: "Community Driven",
            description: "Player feedback shapes the development and future of Homigrad.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>`
        }
    ];

    const featuresContent = document.querySelector('.features-content');

    // Function to create a feature element
    function createFeatureElement(feature) {
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        
        featureItem.innerHTML = `
            <div class="feature-text">
                <div class="feature-title-container">
                    <div class="feature-title">${feature.title}</div>
                    ${feature.icon}
                </div>
                <div class="feature-description">${feature.description}</div>
            </div>
        `;
        
        return featureItem;
    }

    // Generate and append feature elements to the DOM
    function renderFeatures() {
        const featuresList = document.getElementById('features-list');
        
        if (!featuresList) return;
        
        // Clear any existing content
        featuresList.innerHTML = '';
        
        // Add original features
        featuresData.forEach(feature => {
            featuresList.appendChild(createFeatureElement(feature));
        });
        
        // Clone features for continuous scrolling
        featuresData.forEach(feature => {
            featuresList.appendChild(createFeatureElement(feature));
        });
        
        // Adjust animation duration based on number of items
        const totalItems = featuresList.childElementCount;
        const avgItemWidth = getFeatureItemWidth(); // Get responsive width
        const scrollSpeed = 40; // Lower number = slower scroll, higher = faster
        
        // Calculate animation duration based on total width and desired speed
        const calculatedDuration = (avgItemWidth * totalItems) / scrollSpeed;
        featuresList.style.animationDuration = `${calculatedDuration}s`;
    }
    
    // Function to get the responsive feature item width based on viewport
    function getFeatureItemWidth() {
        const viewportWidth = window.innerWidth;
        
        if (viewportWidth <= 480) {
            return 260;
        } else if (viewportWidth <= 768) {
            return 280;
        } else if (viewportWidth <= 992) {
            return 300;
        } else if (viewportWidth >= 1600) {
            return 350;
        } else {
            return 320; // Default width
        }
    }
    
    // Initial render
    renderFeatures();
    
    // Adjust animation on window resize
    window.addEventListener('resize', () => {
        const featuresList = document.getElementById('features-list');
        if (!featuresList) return;
        
        const totalItems = featuresList.childElementCount;
        const newItemWidth = getFeatureItemWidth();
        const scrollSpeed = 40;
        
        const newDuration = (newItemWidth * totalItems) / scrollSpeed;
        featuresList.style.animationDuration = `${newDuration}s`;
    });

    // ===== FEATURE SHOWCASES IN-VIEW DETECTION =====
    // Intersection Observer for showcase items
    const showcaseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Check if majority of the element is visible (at least 60%)
                if (entry.intersectionRatio >= 0.6) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, {
        threshold: [0.6] // Trigger when 60% of the element is visible
    });

    // Observe all showcase items
    const showcaseItems = document.querySelectorAll('.showcase-item');
    showcaseItems.forEach(item => {
        showcaseObserver.observe(item);
    });
}); 