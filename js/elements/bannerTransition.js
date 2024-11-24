document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const banner = document.querySelector('.banner');
        const logo = document.querySelector('.large-logo');
        const buttonContainer = document.querySelector('.banner-buttons');
        
        // Create new elements
        const newTextContainer = document.createElement('div');
        newTextContainer.className = 'banner-text';
        newTextContainer.innerHTML = `
            <h1 class="banner-heading">START PLAYING NOW</h1>
            <a href="/servers.html" class="banner-button view-servers-button">
                <span class="button-text">VIEW SERVERS</span>
            </a>
        `;
        
        // Add transition classes
        logo.classList.add('fade-out');
        buttonContainer.classList.add('fade-out');
        
        // After initial fade out, swap content
        setTimeout(() => {
            logo.style.display = 'none';
            buttonContainer.style.display = 'none';
            banner.appendChild(newTextContainer);
            
            // Trigger fade in
            setTimeout(() => {
                newTextContainer.classList.add('fade-in');
            }, 50);
        }, 500);
    }, 4000);
});