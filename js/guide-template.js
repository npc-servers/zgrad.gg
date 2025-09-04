// Guide Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Initialize copy code functionality
    initCopyCodeBlocks();
    
    // Initialize step animations
    initStepAnimations();
    
    // Initialize back button functionality
    initBackButton();
});

function initSmoothScrolling() {
    // Add smooth scrolling to all anchor links within the page
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initCopyCodeBlocks() {
    // Add copy functionality to code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = 'Copy';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        
        // Add copy button to pre element
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
        
        // Add copy functionality
        copyButton.addEventListener('click', async function() {
            const code = codeBlock.textContent;
            
            try {
                await navigator.clipboard.writeText(code);
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            }
        });
    });
}

function initStepAnimations() {
    // Animate step cards on scroll
    const stepCards = document.querySelectorAll('.step-card');
    
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
    
    stepCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

function initBackButton() {
    const backButton = document.querySelector('.back-button');
    
    if (backButton && !backButton.getAttribute('href')) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if there's a referrer from the same domain
            if (document.referrer && document.referrer.includes(window.location.hostname)) {
                window.history.back();
            } else {
                // Fallback to home page
                window.location.href = '/';
            }
        });
    }
}

// Utility function to add copy functionality to specific elements
function addCopyFunctionality(selector, textSelector = null) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
        element.style.cursor = 'pointer';
        element.setAttribute('title', 'Click to copy');
        
        element.addEventListener('click', async function() {
            const textToCopy = textSelector ? 
                this.querySelector(textSelector).textContent : 
                this.textContent;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Visual feedback
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                this.style.color = '#4caf50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = '';
                }, 1500);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });
}

// Export for use in specific guide pages
window.GuideUtils = {
    addCopyFunctionality,
    initSmoothScrolling,
    initCopyCodeBlocks,
    initStepAnimations,
    initBackButton
};
