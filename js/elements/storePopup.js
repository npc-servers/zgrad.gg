// Create and inject popup HTML
const popupHTML = `
    <div class="overlay" id="popupOverlay"></div>
    <div class="mobile-popup" id="mobilePopup">
        <div class="popup-content">
            <button class="close-button" id="closePopup">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h3>Redirecting to Store</h3>
            <p>Tebex prevents us from store optimizations. You may run into technical issues.</p>
            <div class="redirect-timer">Redirecting in <span id="timer">3</span> seconds...</div>
        </div>
    </div>
`;

// Add popup elements to the body when the script loads
document.body.insertAdjacentHTML('beforeend', popupHTML);

// Function to close popup
function closePopup() {
    const popup = document.getElementById('mobilePopup');
    const overlay = document.getElementById('popupOverlay');
    popup.classList.remove('show');
    overlay.classList.remove('show');
}

// Function to handle store clicks
function handleStoreClick(e) {
    // Only show popup on mobile devices
    if (window.innerWidth <= 768) {
        e.preventDefault();
        const targetUrl = e.currentTarget.href;
        
        const popup = document.getElementById('mobilePopup');
        const overlay = document.getElementById('popupOverlay');
        const timerElement = document.getElementById('timer');
        
        popup.classList.add('show');
        overlay.classList.add('show');
        
        let secondsLeft = 3;
        let countdownInterval;
        
        countdownInterval = setInterval(() => {
            secondsLeft--;
            timerElement.textContent = secondsLeft;
            
            if (secondsLeft <= 0) {
                clearInterval(countdownInterval);
                window.location.href = targetUrl;
            }
        }, 1000);

        // Add click handler for close button
        const closeButton = document.getElementById('closePopup');
        closeButton.onclick = () => {
            clearInterval(countdownInterval);
            closePopup();
        };
    }
}

// Add click handlers to all store links when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get all store buttons with the store-button class
    const storeButtons = document.querySelectorAll('.store-button');
    storeButtons.forEach(button => {
        button.addEventListener('click', handleStoreClick);
    });

    // Get the store link from the navbar
    const navbarStoreLink = document.querySelector('.menu-items a[href*="store"]');
    if (navbarStoreLink) {
        navbarStoreLink.addEventListener('click', handleStoreClick);
    }
});