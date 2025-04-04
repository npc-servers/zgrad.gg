document.addEventListener('DOMContentLoaded', () => {
    // Features data array with all the necessary information
    const featuresData = [
        {
            title: "Realistic Physics",
            description: "Experience enhanced movement and object interaction with our advanced physics engine.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="m4.93 4.93 4.24 4.24"/>
                    <path d="m14.83 9.17 4.24-4.24"/>
                    <path d="m14.83 14.83 4.24 4.24"/>
                    <path d="m9.17 14.83-4.24 4.24"/>
                    <circle cx="12" cy="12" r="4"/>
                </svg>`
        },
        {
            title: "Advanced Damage System",
            description: "Location-based damage with realistic effects that change how you approach combat.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m8.5 14.5-5-5 5-5"/>
                    <path d="m15.5 4.5 5 5-5 5"/>
                    <path d="M8.5 9.5h11"/>
                    <path d="M3 19h18"/>
                </svg>`
        },
        {
            title: "Custom Weapons",
            description: "Unique arsenal designed specifically for Homigrad with balanced gameplay mechanics.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/>
                    <line x1="16" y1="6" x2="16" y2="22"/>
                </svg>`
        },
        {
            title: "Strategic Gameplay",
            description: "Plan your moves and outsmart your opponents with tactical decision-making.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v5"/>
                    <path d="M8 7.4 4 6"/>
                    <path d="m16 7.4 4-1.4"/>
                    <path d="M3 10h2a2 2 0 1 1 0 4h-2a8 8 0 0 0 14 3"/>
                    <path d="M19 18a2 2 0 1 1 0 4h-2"/>
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-1 .05"/>
                </svg>`
        },
        {
            title: "Regular Updates",
            description: "Constantly evolving content and mechanics keep the gameplay fresh and exciting.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                </svg>`
        },
        // Additional features can be easily added here
        {
            title: "Community Driven",
            description: "Player feedback shapes the development and future of Homigrad.",
            icon: `<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>`
        }
    ];

    const featuresContent = document.querySelector('.features-content');

    // Function to create a feature element
    function createFeatureElement(feature) {
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        
        featureItem.innerHTML = `
            <div class="feature-text">
                <div class="feature-title-container">
                    <div class="feature-title">${feature.title}</div>
                    ${feature.icon}
                </div>
                <div class="feature-description">${feature.description}</div>
            </div>
        `;
        
        return featureItem;
    }

    // Generate and append feature elements to the DOM
    function renderFeatures() {
        const featuresList = document.getElementById('features-list');
        
        // Clear any existing content
        featuresList.innerHTML = '';
        
        // Add original features
        featuresData.forEach(feature => {
            featuresList.appendChild(createFeatureElement(feature));
        });
        
        // Clone features for continuous scrolling
        featuresData.forEach(feature => {
            featuresList.appendChild(createFeatureElement(feature));
        });
        
        // Adjust animation duration based on number of items
        const totalItems = featuresList.childElementCount;
        const avgItemWidth = getFeatureItemWidth(); // Get responsive width
        const scrollSpeed = 40; // Lower number = slower scroll, higher = faster
        
        // Calculate animation duration based on total width and desired speed
        const calculatedDuration = (avgItemWidth * totalItems) / scrollSpeed;
        featuresList.style.animationDuration = `${calculatedDuration}s`;
    }
    
    // Function to get the responsive feature item width based on viewport
    function getFeatureItemWidth() {
        const viewportWidth = window.innerWidth;
        
        if (viewportWidth <= 480) {
            return 260;
        } else if (viewportWidth <= 768) {
            return 280;
        } else if (viewportWidth <= 992) {
            return 300;
        } else if (viewportWidth >= 1600) {
            return 350;
        } else {
            return 320; // Default width
        }
    }
    
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
    
    // Initial render
    renderFeatures();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Check on initial load
    handleScroll();
    
    // Adjust animation on window resize
    window.addEventListener('resize', () => {
        const featuresList = document.getElementById('features-list');
        const totalItems = featuresList.childElementCount;
        const newItemWidth = getFeatureItemWidth();
        const scrollSpeed = 40;
        
        const newDuration = (newItemWidth * totalItems) / scrollSpeed;
        featuresList.style.animationDuration = `${newDuration}s`;
    });
}); 