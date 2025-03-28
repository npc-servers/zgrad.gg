document.addEventListener('DOMContentLoaded', () => {
    const featuresContent = document.querySelector('.features-content');
    const featuresList = document.querySelector('.features-list');
    const featureItems = document.querySelectorAll('.feature-item');
    
    // Clone feature items for continuous scrolling
    featureItems.forEach(item => {
        const clone = item.cloneNode(true);
        featuresList.appendChild(clone);
    });
    
    // Adjust animation duration based on number of items
    const totalItems = document.querySelectorAll('.feature-item').length;
    const avgItemWidth = 320; // Average feature item width in pixels
    const scrollSpeed = 40; // Lower number = slower scroll, higher = faster
    
    // Calculate animation duration based on total width and desired speed
    const calculatedDuration = (avgItemWidth * totalItems) / scrollSpeed;
    featuresList.style.animationDuration = `${calculatedDuration}s`;
    
    // Function to check if element is in viewport
    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
        );
    };
    
    // Function to add visible class when element is in viewport
    const handleScroll = () => {
        if (isInViewport(featuresContent)) {
            featuresContent.classList.add('visible');
            
            // Remove scroll listener once animation is triggered
            window.removeEventListener('scroll', handleScroll);
        }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Check on initial load
    handleScroll();
    
    // Adjust animation for window resize
    window.addEventListener('resize', () => {
        const viewportWidth = window.innerWidth;
        let itemWidth = 320;
        
        if (viewportWidth <= 480) {
            itemWidth = 260;
        } else if (viewportWidth <= 768) {
            itemWidth = 280;
        } else if (viewportWidth <= 992) {
            itemWidth = 300;
        }
        
        const newDuration = (itemWidth * totalItems) / scrollSpeed;
        featuresList.style.animationDuration = `${newDuration}s`;
    });
}); 