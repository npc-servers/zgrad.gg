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
}); 