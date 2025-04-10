document.addEventListener('DOMContentLoaded', function() {
    // Sample map data - in a real implementation, this could come from an API or server
    const maps = [
        {
            title: "zgr_mineral",
            description: "A map set dead center of the desert.",
            image: "images/maps/zgr_mineral.png"
        },
        {
            title: "zgr_trap_heaven",
            description: "A gorey map with a lot of traps.",
            image: "images/maps/zgr_trap_heaven.png"
        },
        {
            title: "zgr_harbor",
            description: "A map set in a harbor.",
            image: "images/maps/zgr_harbor.png"
        },
        {
            title: "Underground Bunker",
            description: "Close-quarters combat in a claustrophobic military installation.",
            image: "images/maps/map-bunker.jpg"
        },
        {
            title: "Mansion",
            description: "A sprawling estate with numerous rooms and secret passages.",
            image: "images/maps/map-mansion.jpg"
        }
    ];

    // DOM Elements
    const sliderTrack = document.querySelector('.slider-track');
    const sliderPrev = document.querySelector('.slider-prev');
    const sliderNext = document.querySelector('.slider-next');
    
    let currentIndex = 0;
    let slides = [];

    // Initialize slider
    function initSlider() {
        // Create map slides
        maps.forEach((map, index) => {
            const slide = document.createElement('div');
            slide.className = 'map-slide';
            if (index === currentIndex) slide.classList.add('active');
            
            slide.innerHTML = `
                <img src="${map.image}" alt="${map.title}" class="map-image">
                <div class="map-title-container">
                    <h3 class="map-title">${map.title}</h3>
                </div>
                <div class="map-description-container">
                    <p class="map-description">${map.description}</p>
                </div>
            `;
            
            sliderTrack.appendChild(slide);
            slides.push(slide);
        });
        
        updateSliderPosition();
        setupSlideClicks();
    }
    
    // Setup click events for slides
    function setupSlideClicks() {
        slides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                if (index !== currentIndex) {
                    goToSlide(index);
                }
            });
        });
    }
    
    // Update the slider position
    function updateSliderPosition() {
        // Calculate the center position
        const slideWidth = 100; // percentage
        const offset = slideWidth * currentIndex;
        
        // Update active class
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentIndex) {
                slide.classList.add('active');
            }
        });
        
        // Apply transform with a smooth transition
        sliderTrack.style.transform = `translateX(${-offset}%)`;
    }
    
    // Go to specific slide
    function goToSlide(index) {
        currentIndex = index;
        updateSliderPosition();
    }
    
    // Go to next slide
    function goToNextSlide() {
        currentIndex = (currentIndex + 1) % maps.length;
        updateSliderPosition();
    }
    
    // Go to previous slide
    function goToPrevSlide() {
        currentIndex = (currentIndex - 1 + maps.length) % maps.length;
        updateSliderPosition();
    }
    
    // Event listeners
    sliderNext.addEventListener('click', goToNextSlide);
    sliderPrev.addEventListener('click', goToPrevSlide);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            goToNextSlide();
        } else if (e.key === 'ArrowLeft') {
            goToPrevSlide();
        }
    });
    
    // Auto slide - optional
    let autoSlideInterval;
    
    function startAutoSlide() {
        autoSlideInterval = setInterval(goToNextSlide, 5000); // Change slide every 5 seconds
    }
    
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    
    // Pause auto slide on hover/touch
    const sliderContainer = document.querySelector('.slider-container');
    sliderContainer.addEventListener('mouseenter', stopAutoSlide);
    sliderContainer.addEventListener('mouseleave', startAutoSlide);
    sliderContainer.addEventListener('touchstart', stopAutoSlide, {passive: true});
    sliderContainer.addEventListener('touchend', startAutoSlide, {passive: true});
    
    // Touch swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;
    
    sliderContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    sliderContainer.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
    
    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX + swipeThreshold < touchStartX) {
            goToNextSlide();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            goToPrevSlide();
        }
    }
    
    // Initialize
    initSlider();
    startAutoSlide();
    
    // Handle window resize for responsive behavior
    window.addEventListener('resize', function() {
        updateSliderPosition();
    });
}); 