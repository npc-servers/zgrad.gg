document.addEventListener('DOMContentLoaded', () => {
    const featuresContent = document.querySelector('.features-content');
    const featureItems = document.querySelectorAll('.feature-item');
    
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
            
            // Apply animation to each feature item
            featureItems.forEach((item, index) => {
                // Reset animation for proper trigger
                item.style.animationDelay = `${0.1 * (index + 1)}s`;
                item.style.animationName = 'none';
                
                // Force reflow
                void item.offsetWidth;
                
                // Re-add animation
                item.style.animationName = 'featureItemFadeIn';
            });
            
            // Remove scroll listener once animation is triggered
            window.removeEventListener('scroll', handleScroll);
        }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Check on initial load
    handleScroll();
}); 