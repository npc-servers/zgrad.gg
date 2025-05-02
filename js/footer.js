document.addEventListener('DOMContentLoaded', function() {
    // Get the current year for the copyright
    const currentYear = new Date().getFullYear();
    const copyrightElement = document.getElementById('copyright-year');
    
    if (copyrightElement) {
        copyrightElement.textContent = currentYear;
    }

    // Initialize any footer links that should track analytics
    const footerLinks = document.querySelectorAll('.footer-links a[data-track]');
    
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const trackName = this.getAttribute('data-track');
            // If you have analytics, you can implement tracking here
            console.log(`Tracked click on: ${trackName}`);
        });
    });
    
    // Handle social icons hover effect
    const socialIcons = document.querySelectorAll('.social-icons a');
    
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            socialIcons.forEach(otherIcon => {
                if (otherIcon !== icon) {
                    otherIcon.style.opacity = '0.5';
                }
            });
        });
        
        icon.addEventListener('mouseleave', function() {
            socialIcons.forEach(otherIcon => {
                otherIcon.style.opacity = '1';
            });
        });
    });
}); 