document.addEventListener('DOMContentLoaded', function() {
    // Sample map data - in a real implementation, this could come from an API or server
    const maps = [
        {
            title: "Abandoned Factory",
            description: "Navigate through dark corridors and machinery in this industrial setting.",
            image: "images/maps/zgr_mineral.png"
        },
        {
            title: "Downtown",
            description: "Urban warfare in the heart of the city with multiple levels and hiding spots.",
            image: "images/maps/map-downtown.jpg"
        },
        {
            title: "Lakeside Resort",
            description: "A luxury vacation spot turned deadly - perfect for long-range encounters.",
            image: "images/maps/map-lakeside.jpg"
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

    // Initialize slider
    function initSlider() {
        // Create map slides
        maps.forEach((map, index) => {
            const slide = document.createElement('div');
            slide.className = 'map-slide';
            
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
        });
        
        updateSliderPosition();
    }
    
    // Update the slider position
    function updateSliderPosition() {
        sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
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
    
    // Initialize
    initSlider();
    startAutoSlide();
    
    // Handle window resize for responsive behavior
    window.addEventListener('resize', function() {
        updateSliderPosition();
    });
}); 