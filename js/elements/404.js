const messages = [
    "Looks like you took a wrong turn...",
    "This page has vanished into the void",
    "Houston, we have a problem",
    "The page is in another castle",
    "Error: Success",
    "Oops! Page not included in the bundle",
    "You have discovered nothing!",
    "The requested page is on vacation",
    "This is not the page you're looking for",
    "404 pixels not found"
];

window.addEventListener('load', () => {
    const messageElement = document.getElementById('randomMessage');
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    messageElement.textContent = randomMessage;
    
    // Small delay before showing the message for better effect
    setTimeout(() => {
        messageElement.classList.add('visible');
    }, 500);
});