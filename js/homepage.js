// Homepage specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Add animation to the landing text
    const landingText = document.querySelector('.landing-text');
    if (landingText) {
        landingText.style.opacity = '0';
        landingText.style.transform = 'translateY(20px)';
        landingText.style.transition = 'opacity 1s ease, transform 1s ease';
        
        setTimeout(() => {
            landingText.style.opacity = '1';
            landingText.style.transform = 'translateY(0)';
        }, 500);
    }
    
    // Add animation to the logo
    const logo = document.querySelector('.main-logo');
    if (logo) {
        logo.style.opacity = '0';
        logo.style.transform = 'translateX(-20px)';
        logo.style.transition = 'opacity 1s ease, transform 1s ease';
        
        setTimeout(() => {
            logo.style.opacity = '1';
            logo.style.transform = 'translateX(0)';
        }, 200);
    }
    
    // Add animation to the CTA elements
    const ctaContainer = document.querySelector('.cta-container');
    if (ctaContainer) {
        // Hide the container initially
        ctaContainer.style.opacity = '0';
        
        // Animate each element separately for a sequential effect
        const ctaBox = document.querySelector('.cta-box');
        const ctaButton = document.querySelector('.cta-button');
        
        if (ctaBox) {
            ctaBox.style.transform = 'translateX(50px)';
            ctaBox.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            ctaBox.style.opacity = '0';
        }
        
        if (ctaButton) {
            ctaButton.style.transform = 'translateX(70px)';
            ctaButton.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            ctaButton.style.opacity = '0';
        }
        
        // Show the container
        setTimeout(() => {
            ctaContainer.style.opacity = '1';
            
            // Animate the box first
            if (ctaBox) {
                setTimeout(() => {
                    ctaBox.style.opacity = '1';
                    ctaBox.style.transform = 'translateX(0)';
                }, 100);
            }
            
            // Then animate the button
            if (ctaButton) {
                setTimeout(() => {
                    ctaButton.style.opacity = '1';
                    ctaButton.style.transform = 'translateX(0)';
                }, 300);
            }
        }, 800);
    }
    
    // Add animation to the side buttons (Discord and Store)
    const sideButtonsContainer = document.querySelector('.side-buttons-container');
    if (sideButtonsContainer) {
        // Hide the container initially
        sideButtonsContainer.style.opacity = '0';
        
        // Get the buttons
        const buttons = sideButtonsContainer.querySelectorAll('.side-button');
        
        // Set initial states for each button
        buttons.forEach(button => {
            button.style.transform = 'translateX(-50px)';
            button.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
            button.style.opacity = '0';
        });
        
        // Show the container with a delay similar to CTA
        setTimeout(() => {
            sideButtonsContainer.style.opacity = '1';
            
            // Animate each button with a slight delay between them
            buttons.forEach((button, index) => {
                setTimeout(() => {
                    button.style.opacity = '1';
                    button.style.transform = 'translateX(0)';
                }, 100 + (index * 200)); // 100ms base delay + 200ms per button
            });
        }, 800);
    }
}); 