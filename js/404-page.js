// 404 Page JavaScript
document.addEventListener('DOMContentLoaded', function() {

    // Add some interactive effects
    const errorButtons = document.querySelectorAll('.error-button');
    
    errorButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click animation to buttons
    errorButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add some subtle animations on scroll (if any scrolling occurs)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);


    // Add some fun interactive elements
    const errorNumber = document.querySelector('.error-number');
    if (errorNumber) {
        errorNumber.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.textShadow = '0 0 30px rgba(255, 0, 0, 0.8)';
        });
        
        errorNumber.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.textShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        });
    }

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedButton = document.activeElement;
            if (focusedButton && focusedButton.classList.contains('error-button')) {
                focusedButton.click();
            }
        }
    });

    // Add focus management for accessibility
    errorButtons.forEach((button, index) => {
        button.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--accent-color)';
            this.style.outlineOffset = '2px';
        });
        
        button.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });

    // Add some console easter egg
    console.log('%c404 - Page Not Found', 'color: #ff0000; font-size: 20px; font-weight: bold;');
    console.log('%cThe page you\'re looking for has been lost in the chaos of Homigrad!', 'color: #ff6b00; font-size: 14px;');
    console.log('%cJoin our Discord: https://discord.gg/npc', 'color: #7289da; font-size: 12px;');
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .error-button {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
