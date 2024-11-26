document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in class to elements once they're in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('indesc-fade-in');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe description content elements
    const descriptionElements = document.querySelectorAll('.indesc-description-text, .indesc-description-stats, .indesc-description-image');
    descriptionElements.forEach(el => observer.observe(el));

    // Parallax effect for the image
    const parallaxImage = document.querySelector('.indesc-parallax-image');
    if (parallaxImage) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.15;
            
            // Only apply transform if the element is in viewport
            const rect = parallaxImage.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                parallaxImage.style.transform = `scale(1.1) translateY(${rate}px)`;
            }
        });
    }

    // Function to animate number counting
    const animateCount = (el, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            el.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // Function to update total players count
    const updateTotalPlayers = () => {
        const totalPlayersElement = document.getElementById('totalPlayers');
        if (!totalPlayersElement) return;

        let totalPlayers = 0;
        const playerElements = document.querySelectorAll('.card-players');
        
        playerElements.forEach(element => {
            if (element && element.textContent) {
                // Extract number before the '/' in strings like "12/24 players online"
                const match = element.textContent.match(/^(\d+)/);
                if (match) {
                    totalPlayers += parseInt(match[1]);
                }
            }
        });

        // Get the current displayed value
        const currentValue = parseInt(totalPlayersElement.textContent) || 0;
        
        // Only animate if the value is different
        if (currentValue !== totalPlayers) {
            animateCount(totalPlayersElement, currentValue, totalPlayers, 1000);
        }
    };

    // Create a MutationObserver to watch for changes in player counts
    const playerCountObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
                updateTotalPlayers();
            }
        });
    });

    // Observe all card-players elements for changes
    document.querySelectorAll('.card-players').forEach(element => {
        playerCountObserver.observe(element, {
            characterData: true,
            childList: true,
            subtree: true
        });
    });

    // Initial update
    updateTotalPlayers();

    // Update every 30 seconds to stay in sync with server stats
    setInterval(updateTotalPlayers, 30000);
});