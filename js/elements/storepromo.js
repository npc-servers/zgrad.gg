document.addEventListener('DOMContentLoaded', function() {
    // Configuration object
    const promoConfig = {
        messages: [
            "Don't miss out!",
            "Make the most of your experience!",
            "Support us!",
            "Level up your game!",
            "Join the elite!"
        ],
        description: "Upgrade your gaming experience with exclusive in-game items, custom skins, and special perks. Use code \"LAUNCH\" for a special discount!",
        couponCode: "LAUNCH"
    };

    // Initialize elements
    const promoMessageElement = document.querySelector('.promo-message');
    const promoDescriptionElement = document.querySelector('.promo-description');
    const codeElement = document.querySelector('.clickable-code');
    let currentMessageIndex = 0;

    // Set initial content
    promoDescriptionElement.textContent = promoConfig.description;
    codeElement.textContent = promoConfig.couponCode;

    function showMessage(index) {
        promoMessageElement.classList.remove('visible');
        setTimeout(() => {
            promoMessageElement.textContent = promoConfig.messages[index];
            promoMessageElement.classList.add('visible');
        }, 500);
    }

    // Initialize first message
    showMessage(currentMessageIndex);

    // Rotate messages every 4 seconds
    setInterval(() => {
        currentMessageIndex = (currentMessageIndex + 1) % promoConfig.messages.length;
        showMessage(currentMessageIndex);
    }, 4000);

    // Copy code functionality
    codeElement.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(promoConfig.couponCode);
            codeElement.classList.add('copied');
            
            // Reset after 2 seconds
            setTimeout(() => {
                codeElement.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });
});