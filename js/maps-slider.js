document.addEventListener('DOMContentLoaded', () => {
    initMapsSlider();
});

function initMapsSlider() {
    // Sample maps data - in a real implementation, this could be fetched from an API
    const maps = [
        {
            id: 1,
            name: "MINERAL",
            description: "A bustling urban environment with plenty of hiding spots and verticality for intense gameplay.",
            image: "images/maps/zgr_mineral.png"
        },
        {
            id: 2,
            name: "HARBOR",
            description: "Navigate through shipping containers and warehouses in this coastal industrial area.",
            image: "images/maps/zgr_harbor.png"
        },
        {
            id: 3,
            name: "TRAP HEAVEN",
            description: "A luxurious estate with multiple floors, secret passages, and expansive grounds.",
            image: "images/maps/zgr_trap_heaven.png"
        }
    ];

    // Create slider HTML
    createSliderHTML(maps);
    
    // Setup slider functionality
    setupSliderFunctionality(maps);
}

function createMapSlide(map, index, isClone = false) {
    const slide = document.createElement('div');
    slide.className = `map-slide ${index === 0 && !isClone ? 'active' : ''}`;
    slide.dataset.id = map.id;
    slide.dataset.index = index;
    if (isClone) {
        slide.dataset.clone = 'true';
        slide.dataset.originalIndex = index;
    }
    
    slide.innerHTML = `
        <img src="${map.image}" alt="${map.name}" class="map-slide-image">
        <div class="map-slide-info">
            <div class="map-slide-title">${map.name}</div>
            <div class="map-slide-description">${map.description}</div>
        </div>
    `;
    
    return slide;
}

function createSliderHTML(maps) {
    const sliderWrapper = document.querySelector('.maps-slider-wrapper');
    
    if (!sliderWrapper) return;
    
    // Add second-to-last slide clone at the beginning (for better looping)
    if (maps.length > 1) {
        const secondToLastMap = maps[maps.length - 2];
        sliderWrapper.appendChild(createMapSlide(secondToLastMap, maps.length - 2, true));
    }
    
    // Add last slide clone at the beginning
    const lastMap = maps[maps.length - 1];
    sliderWrapper.appendChild(createMapSlide(lastMap, maps.length - 1, true));
    
    // Add original slides
    maps.forEach((map, index) => {
        sliderWrapper.appendChild(createMapSlide(map, index));
    });
    
    // Add first slide clone at the end
    const firstMap = maps[0];
    sliderWrapper.appendChild(createMapSlide(firstMap, 0, true));
    
    // Add second slide clone at the end (for better looping)
    if (maps.length > 1) {
        const secondMap = maps[1];
        sliderWrapper.appendChild(createMapSlide(secondMap, 1, true));
    }
    
    // Create pagination dots
    const paginationContainer = document.querySelector('.maps-slider-pagination');
    
    if (paginationContainer) {
        maps.forEach((map, index) => {
            const dot = document.createElement('div');
            dot.className = `pagination-dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            paginationContainer.appendChild(dot);
        });
    }
}

function setupSliderFunctionality(maps) {
    const slider = document.querySelector('.maps-slider');
    const sliderWrapper = document.querySelector('.maps-slider-wrapper');
    const slides = document.querySelectorAll('.map-slide');
    const prevButton = document.querySelector('.slider-nav-button.prev');
    const nextButton = document.querySelector('.slider-nav-button.next');
    const paginationDots = document.querySelectorAll('.pagination-dot');
    
    if (!slider || !sliderWrapper || slides.length === 0) return;
    
    // Add extra clones if we have very few slides (to ensure proper looping)
    const cloneOffset = maps.length > 1 ? 2 : 1;
    
    let currentIndex = cloneOffset; // Start at first real slide (after clone slides)
    const slideCount = maps.length;
    let isTransitioning = false;
    let isLooping = false;
    
    // Handle swipe gestures
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left - go to next slide
            goToSlide(currentIndex + 1, true);
        } else if (touchEndX > touchStartX + 50) {
            // Swipe right - go to previous slide
            goToSlide(currentIndex - 1, true);
        }
    }
    
    // Set initial slide position
    updateSlider(false);
    
    // Event listeners
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            goToSlide(currentIndex - 1, true);
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            goToSlide(currentIndex + 1, true);
        });
    }
    
    // Make slides clickable
    slides.forEach((slide, index) => {
        // Don't make clone slides clickable in the same way
        if (!slide.dataset.clone) {
            slide.addEventListener('click', () => {
                if (index !== currentIndex) {
                    // Account for the clone slides
                    goToSlide(index + cloneOffset - slideCount * Math.floor((index + cloneOffset) / slideCount), true);
                }
            });
        }
    });
    
    // Pagination dots click event
    paginationDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            // Add offset to account for the clone slides
            goToSlide(index + cloneOffset, true);
        });
    });
    
    // Handle infinite loop
    sliderWrapper.addEventListener('transitionend', handleTransitionEnd);
    
    function handleTransitionEnd(e) {
        // Only process transform transitions, not opacity/scale transitions
        if (e.propertyName !== 'transform' || !isTransitioning) return;
        
        isTransitioning = false;
        
        // If we're looping, we need to handle the transition to the real slide
        if (isLooping) {
            isLooping = false;
            
            const lastRealIndex = cloneOffset + slideCount - 1;
            
            // Handle loop back to the beginning
            if (currentIndex < cloneOffset) {
                // We've gone before the first real slide, jump to the corresponding real slide from the end
                sliderWrapper.style.transition = 'none';
                currentIndex = lastRealIndex - (cloneOffset - currentIndex - 1);
                
                // Keep both clone and original slide in "active" state during the transition
                updateSlideActiveStates();
                updateSlider(false);
                
                // Force reflow to apply the change instantly
                void sliderWrapper.offsetWidth;
                sliderWrapper.style.transition = 'transform 0.5s ease';
            } 
            // Handle loop to the end
            else if (currentIndex > lastRealIndex) {
                // We've gone past the last real slide, jump to the corresponding real slide from the beginning
                sliderWrapper.style.transition = 'none';
                currentIndex = cloneOffset + (currentIndex - lastRealIndex - 1);
                
                // Keep both clone and original slide in "active" state during the transition
                updateSlideActiveStates();
                updateSlider(false);
                
                // Force reflow to apply the change instantly
                void sliderWrapper.offsetWidth;
                sliderWrapper.style.transition = 'transform 0.5s ease';
            }
        }
    }
    
    function goToSlide(index, isManual = true) {
        if (isTransitioning) return;
        
        isTransitioning = true;
        
        const lastRealIndex = cloneOffset + slideCount - 1;
        
        // Check if we're going to a clone slide
        if (index < cloneOffset || index > lastRealIndex) {
            isLooping = true;
        }
        
        currentIndex = index;
        
        // Update active states before the slide transition
        updateSlideActiveStates();
        
        // Update the slider position
        updateSlider(true);
        
        // Reset autoplay with appropriate timing
        if (isManual) {
            resetAutoplayAfterManual();
        } else {
            resetAutoplay();
        }
    }
    
    // Update which slides should be active or clone-active
    function updateSlideActiveStates() {
        const realIndex = getRealIndex();
        
        // Remove all active classes first
        slides.forEach((slide) => {
            slide.classList.remove('active');
            slide.classList.remove('clone-active');
        });
        
        // Set the active class on the current visible slide
        if (slides[currentIndex]) {
            slides[currentIndex].classList.add('active');
        }
        
        // If we're at a clone slide, keep the corresponding real slide in a semi-active state
        if (isLooping) {
            const lastRealIndex = cloneOffset + slideCount - 1;
            
            if (currentIndex < cloneOffset) {
                // Before the first real slide - set clone-active on the corresponding real slide from the end
                const realSlideIndex = lastRealIndex - (cloneOffset - currentIndex - 1);
                if (slides[realSlideIndex]) {
                    slides[realSlideIndex].classList.add('clone-active');
                }
            } else if (currentIndex > lastRealIndex) {
                // After the last real slide - set clone-active on the corresponding real slide from the beginning
                const realSlideIndex = cloneOffset + (currentIndex - lastRealIndex - 1);
                if (slides[realSlideIndex]) {
                    slides[realSlideIndex].classList.add('clone-active');
                }
            }
        }
        
        // Update pagination dots
        paginationDots.forEach((dot, index) => {
            if (index === realIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Auto-play functionality
    let autoplayInterval;
    let manualTransitionDelay;
    
    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            goToSlide(currentIndex + 1, false); // false = not manual
        }, 5000); // Change slide every 5 seconds
    }
    
    function stopAutoplay() {
        clearInterval(autoplayInterval);
        clearTimeout(manualTransitionDelay);
    }
    
    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }
    
    function resetAutoplayAfterManual() {
        stopAutoplay();
        // Start autoplay with 8-second delay after manual transition
        manualTransitionDelay = setTimeout(() => {
            startAutoplay();
        }, 8000);
    }
    
    // Start autoplay
    startAutoplay();
    
    // Pause autoplay on hover
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    
    // Update slider position and active states
    function updateSlider(animated = true) {
        // Get slide width and window width
        const slideStyle = window.getComputedStyle(slides[0]);
        const slideWidthPercent = parseFloat(slideStyle.flexBasis);
        const windowWidth = window.innerWidth;
        
        // Calculate the initial offset based on screen size
        let initialOffset;
        if (windowWidth <= 480) {
            initialOffset = 10;
        } else if (windowWidth <= 768) {
            initialOffset = 15;
        } else if (windowWidth <= 992) {
            initialOffset = 17.5;
        } else {
            initialOffset = 20;
        }
        
        // Calculate offset for centering the active slide
        const offset = initialOffset - (currentIndex * slideWidthPercent);
        
        // Set transition based on whether we want animation
        if (!animated) {
            sliderWrapper.style.transition = 'none';
        } else {
            sliderWrapper.style.transition = 'transform 0.5s ease';
        }
        
        // Apply transform
        sliderWrapper.style.transform = `translateX(${offset}%)`;
        
        // If we disabled transition, re-enable it after the transform is applied
        if (!animated) {
            // Force reflow to apply the change instantly
            void sliderWrapper.offsetWidth;
            sliderWrapper.style.transition = 'transform 0.5s ease';
        }
    }
    
    // Get the real index (accounting for the clone slides)
    function getRealIndex() {
        // Handle edge cases with the clone slides
        const lastRealIndex = cloneOffset + slideCount - 1;
        
        if (currentIndex < cloneOffset) {
            // Before first real slide
            return slideCount - (cloneOffset - currentIndex);
        } else if (currentIndex > lastRealIndex) {
            // After last real slide
            return currentIndex - lastRealIndex - 1;
        } else {
            // Within the real slides range
            return currentIndex - cloneOffset;
        }
    }
    
    // Check for resize and update slider
    window.addEventListener('resize', () => updateSlider(false));
} 