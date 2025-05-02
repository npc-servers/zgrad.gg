// Help Section JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // For future functionality related to the help section
    // For now, this file is mostly a placeholder but can be extended as needed
    
    const helpBox = document.querySelector('.help-box');
    
    // Add simple hover effect
    if (helpBox) {
        helpBox.addEventListener('mouseenter', () => {
            helpBox.style.transform = 'translateY(-3px)';
            helpBox.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
            helpBox.style.transition = 'all 0.3s ease';
        });
        
        helpBox.addEventListener('mouseleave', () => {
            helpBox.style.transform = 'translateY(0)';
            helpBox.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
            helpBox.style.transition = 'all 0.3s ease';
        });
    }
    
    // Guidelines link animation
    const guidelinesLink = document.querySelector('.guidelines-link');
    if (guidelinesLink) {
        guidelinesLink.addEventListener('mouseenter', () => {
            guidelinesLink.style.transform = 'translateY(-2px)';
            guidelinesLink.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            
            const arrowIcon = guidelinesLink.querySelector('.arrow-icon');
            if (arrowIcon) {
                arrowIcon.style.transform = 'translateX(4px)';
            }
        });
        
        guidelinesLink.addEventListener('mouseleave', () => {
            guidelinesLink.style.transform = 'translateY(0)';
            guidelinesLink.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
            
            const arrowIcon = guidelinesLink.querySelector('.arrow-icon');
            if (arrowIcon) {
                arrowIcon.style.transform = 'translateX(0)';
            }
        });
    }
}); 