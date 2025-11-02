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
        this.setActiveLink();
        
        // Listen for scroll events
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.setActiveLink());
        
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
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
    }

    openMobileMenu() {
        this.isMobileMenuOpen = true;
        this.hamburger.classList.add('active');
        this.mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Update active link to reflect current page
        this.setActiveLink();
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.hamburger.classList.remove('active');
        
        // Apply fade-out animation to menu items
        const navItems = document.querySelectorAll('.mobile-menu .nav-link');
        const socialSection = document.querySelector('.mobile-menu .navbar-social');
        
        navItems.forEach((item, index) => {
            item.style.animation = `slideDownFadeOut 0.3s ease-out ${index * 0.05}s forwards`;
        });
        
        if (socialSection) {
            socialSection.style.animation = 'slideDownFadeOut 0.3s ease-out 0s forwards';
        }
        
        // Close the menu after animation completes
        setTimeout(() => {
            this.mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset animation styles
            navItems.forEach(item => {
                item.style.animation = '';
            });
            if (socialSection) {
                socialSection.style.animation = '';
            }
        }, 300);
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
        
        // Update active link based on current page
        this.setActiveLink();
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
    }

    setActiveLink() {
        // Use requestAnimationFrame to batch layout reads
        if (this.activeLinkRAF) {
            cancelAnimationFrame(this.activeLinkRAF);
        }
        
        this.activeLinkRAF = requestAnimationFrame(() => {
            // Get current page info
            const currentPath = window.location.pathname;
            const isIndex = currentPath === '/' || currentPath === '/index.html' || currentPath === '';
            
            // Remove active class from all links (both desktop and mobile)
            const allLinks = document.querySelectorAll('.nav-link');
            allLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // If on index page, check which section to highlight
            if (isIndex) {
                // Check if scrolled to help section
                const helpSection = document.getElementById('help-section');
                if (helpSection) {
                    const helpRect = helpSection.getBoundingClientRect();
                    const isHelpInView = helpRect.top < window.innerHeight && helpRect.bottom > 0;
                    
                    if (isHelpInView) {
                        // Show HELP as active
                        const helpLinks = document.querySelectorAll('a[href="/#help-section"]');
                        helpLinks.forEach(link => {
                            link.classList.add('active');
                        });
                        return;
                    }
                }
                
                // Otherwise show HOME as active
                const homeLinks = document.querySelectorAll('a[href="/"]');
                homeLinks.forEach(link => {
                    link.classList.add('active');
                });
                return;
            }
        
        // If on servers page, activate SERVERS
        if (currentPath.includes('/servers')) {
            const serversLinks = document.querySelectorAll('a[href="/servers"]');
            serversLinks.forEach(link => {
                link.classList.add('active');
            });
            return;
        }
        
            // If on rules page, activate RULES
            if (currentPath.includes('/rules')) {
                const rulesLinks = document.querySelectorAll('a[href="/rules"]');
                rulesLinks.forEach(link => {
                    link.classList.add('active');
                });
                return;
            }
        });
    }
}

// Initialize navbar manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
});
