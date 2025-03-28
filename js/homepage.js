// Homepage specific JavaScript

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
}); 