/**
 * Common documentation page functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation highlighting
    const navLinks = document.querySelectorAll('.docs-nav a');
    const sections = document.querySelectorAll('.docs-section');
    
    // Function to update active navigation link
    function updateActiveNavLink() {
        let currentSectionId = '';
        
        // Find the current section based on scroll position
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        // Update active class
        navLinks.forEach(link => {
            link.parentElement.classList.remove('active');
            
            const href = link.getAttribute('href').substring(1);
            if (href === currentSectionId) {
                link.parentElement.classList.add('active');
            }
        });
    }
    
    // Add smooth scroll to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 50,
                behavior: 'smooth'
            });
            
            // Update URL hash without scrolling
            history.pushState(null, null, `#${targetId}`);
            
            // Update active link
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Initial call to set active link based on URL hash or first section
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const activeLink = document.querySelector(`.docs-nav a[href="#${hash}"]`);
        
        if (activeLink) {
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            activeLink.parentElement.classList.add('active');
            
            // Scroll to section after a short delay (to allow page to render fully)
            setTimeout(() => {
                const targetSection = document.getElementById(hash);
                window.scrollTo({
                    top: targetSection.offsetTop - 50,
                    behavior: 'smooth'
                });
            }, 100);
        }
    } else {
        // Set first nav item as active if no hash
        if (navLinks.length > 0) {
            navLinks[0].parentElement.classList.add('active');
        }
    }
}); 