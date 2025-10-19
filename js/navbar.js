// Navbar Functionality

class NavbarManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section');
        this.hamburger = document.querySelector('.navbar-hamburger');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.lastScrollTop = 0;
        this.isVisible = true;
        this.isMobileMenuOpen = false;
        
        this.init();
    }

    init() {
        // Highlight active nav link based on current page
        this.updateActiveLink();
        
        // Listen for scroll events
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.updateActiveLink());
        
        // Add click handlers to nav links for smooth scrolling
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavLinkClick(e));
        });

        // Hamburger menu toggle
        if (this.hamburger) {
            this.hamburger.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close mobile menu when clicking nav links
        const mobileMenuLinks = document.querySelectorAll('.mobile-menu .nav-link');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());
        });

        // Update active link on page load
        this.setActiveLink();
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
    }

    openMobileMenu() {
        this.isMobileMenuOpen = true;
        this.hamburger.classList.add('active');
        this.mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.hamburger.classList.remove('active');
        this.mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleNavLinkClick(event) {
        const href = event.currentTarget.getAttribute('href');
        
        // Only prevent default for anchor links (starting with #)
        if (href.startsWith('#')) {
            event.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Don't hide navbar if mobile menu is open or on desktop (> 768px)
        const isMobileView = window.innerWidth <= 768;
        if (!this.isMobileMenuOpen && isMobileView) {
            // Hide/show navbar on scroll (only on mobile)
            if (currentScroll > this.lastScrollTop && currentScroll > 100) {
                // Scrolling down
                if (this.isVisible) {
                    this.hideNavbar();
                }
            } else {
                // Scrolling up
                if (!this.isVisible) {
                    this.showNavbar();
                }
            }
        } else if (!isMobileView && !this.isVisible) {
            // Ensure navbar is always visible on desktop
            this.showNavbar();
        }
        
        this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        
        // Update active link based on section visibility
        this.updateActiveLink();
    }

    hideNavbar() {
        this.isVisible = false;
        this.navbar.style.transform = 'translateY(-100%)';
        this.navbar.style.transition = 'transform 0.3s ease-out';
    }

    showNavbar() {
        this.isVisible = true;
        this.navbar.style.transform = 'translateY(0)';
        this.navbar.style.transition = 'transform 0.3s ease-out';
    }

    updateActiveLink() {
        const scrollPosition = window.scrollY + 100; // Offset for navbar height
        
        let currentSection = null;
        
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section;
            }
        });
        
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current section's link
        if (currentSection) {
            const sectionId = currentSection.getAttribute('id');
            if (sectionId) {
                const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }
        
        // Highlight HOME link when at top of page
        if (scrollPosition < 200) {
            const homeLink = document.querySelector('a[href="/"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    }

    setActiveLink() {
        // Determine active link based on current URL
        const currentPath = window.location.pathname;
        
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            // Check if the link matches current path
            if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
                link.classList.add('active');
            } else if (href !== '/' && currentPath.includes(href)) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize navbar manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
});
