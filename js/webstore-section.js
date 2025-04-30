document.addEventListener('DOMContentLoaded', function() {
    initWebstoreSection();
});

function initWebstoreSection() {
    // Initialize rank panels slider
    const rankPanels = document.querySelectorAll('.rank-panel');
    const rankNavDots = document.querySelectorAll('.rank-nav-dot');
    const ranksSlider = document.querySelector('.ranks-slider');
    const ranksSliderWrapper = document.querySelector('.ranks-slider-wrapper');
    
    if (!rankPanels.length || !rankNavDots.length) return;
    
    // Set the default starting index to 1 (Supporter+)
    const defaultIndex = 1;
    
    // Force setup for all panels to ensure they're properly positioned initially
    rankPanels.forEach((panel, index) => {
        if (index === defaultIndex) {
            panel.classList.add('active');
            panel.style.position = 'relative';
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
            panel.style.pointerEvents = 'auto';
        } else {
            panel.classList.remove('active');
            panel.style.position = 'absolute';
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            panel.style.pointerEvents = 'none';
        }
    });
    
    // Also set the correct nav dot to active
    rankNavDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === defaultIndex);
    });
    
    let currentPanelIndex = defaultIndex;
    let autoSlideInterval;
    let isTransitioning = false;
    let isInView = false;
    
    // Function to show a specific rank panel
    function showRankPanel(index, animate = true) {
        if (isTransitioning || !isInView) return;
        isTransitioning = animate;
        
        // Remove active class from all panels and nav dots
        rankPanels.forEach((panel, i) => {
            panel.classList.remove('active');
            panel.style.position = 'absolute';
            panel.style.pointerEvents = 'none';
            panel.style.zIndex = '1';
            
            if (animate) {
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(20px)';
            }
        });
        
        rankNavDots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Add active class to selected panel and nav dot
        rankPanels[index].classList.add('active');
        rankPanels[index].style.position = 'relative';
        rankPanels[index].style.pointerEvents = 'auto';
        rankPanels[index].style.zIndex = '2';
        
        if (animate) {
            setTimeout(() => {
                rankPanels[index].style.opacity = '1';
                rankPanels[index].style.transform = 'translateY(0)';
            }, 10); // Small delay to ensure the transition works
        } else {
            rankPanels[index].style.opacity = '1';
            rankPanels[index].style.transform = 'translateY(0)';
        }
        
        rankNavDots[index].classList.add('active');
        
        // After transition completes
        if (animate) {
            setTimeout(() => {
                isTransitioning = false;
            }, 500); // Match transition duration from CSS
        }
        
        currentPanelIndex = index;
    }
    
    // Add click event listeners to nav dots
    rankNavDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (index !== currentPanelIndex && isInView) {
                showRankPanel(index);
                resetAutoSlide();
            }
        });
    });
    
    // Auto slide functionality
    function startAutoSlide() {
        clearInterval(autoSlideInterval);
        if (isInView) {
            autoSlideInterval = setInterval(() => {
                if (!isTransitioning && isInView) {
                    let nextIndex = (currentPanelIndex + 1) % rankPanels.length;
                    showRankPanel(nextIndex);
                }
            }, 6000); // Adjust timing to match site style
        }
    }
    
    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }
    
    // Intersection Observer for viewport detection
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3 // 30% of the element needs to be visible
    };
    
    const rankSliderObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isInView = true;
                ranksSlider.setAttribute('data-in-view', 'true');
                startAutoSlide();
            } else {
                isInView = false;
                ranksSlider.setAttribute('data-in-view', 'false');
                clearInterval(autoSlideInterval);
            }
        });
    }, observerOptions);
    
    // Observe the ranks slider
    if (ranksSlider) {
        rankSliderObserver.observe(ranksSlider);
    }
    
    // Pause auto-sliding when hovering over panels
    ranksSlider.addEventListener('mouseenter', () => {
        if (isInView) {
            clearInterval(autoSlideInterval);
        }
    });
    
    ranksSlider.addEventListener('mouseleave', () => {
        if (isInView) {
            startAutoSlide();
        }
    });
    
    // Touch events support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    ranksSlider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        if (isInView) {
            clearInterval(autoSlideInterval);
        }
    }, { passive: true });
    
    ranksSlider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (isInView) {
            handleSwipe();
            startAutoSlide();
        }
    }, { passive: true });
    
    function handleSwipe() {
        if (isTransitioning || !isInView) return;
        
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) >= swipeThreshold) {
            if (swipeDistance < 0) {
                // Swiped left - next panel
                let nextIndex = (currentPanelIndex + 1) % rankPanels.length;
                showRankPanel(nextIndex);
            } else {
                // Swiped right - previous panel
                let prevIndex = (currentPanelIndex - 1 + rankPanels.length) % rankPanels.length;
                showRankPanel(prevIndex);
            }
        }
    }
} 