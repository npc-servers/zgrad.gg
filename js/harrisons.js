// Add fade-in animation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const elements = [
        document.querySelector('.merger-announcement'),
        document.querySelector('.merger-reason'),
        document.querySelector('.about-us'),
        document.querySelector('.proceed-button')
    ];

    // Fade in elements sequentially
    elements.forEach((element, index) => {
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 200 * index);
        }
    });
}); 