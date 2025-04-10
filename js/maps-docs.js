/**
 * Maps documentation specific functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle left navigation
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Add click event to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get target section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Smooth scroll to section
                window.scrollTo({
                    top: targetSection.offsetTop - 50,
                    behavior: 'smooth'
                });
                
                // Update URL hash
                history.pushState(null, null, `#${targetId}`);
                
                // Update active link
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Check for hash in URL on page load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const section = document.getElementById(hash);
        
        if (section) {
            // Scroll to section after a short delay
            setTimeout(() => {
                window.scrollTo({
                    top: section.offsetTop - 50,
                    behavior: 'smooth'
                });
                
                // Update active link
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    
                    const href = link.getAttribute('href').substring(1);
                    if (href === hash) {
                        link.classList.add('active');
                    }
                });
            }, 100);
        }
    }
}); 