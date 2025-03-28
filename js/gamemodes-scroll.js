document.addEventListener('DOMContentLoaded', () => {
    const gamemodes = [
        'Homicide',
        'Wild West',
        'Zombie Survival',
        'TDM',
        'Cops and Robbers',
        'Emergency',
        'War on Terror'
    ];
    
    const scrollContent = document.getElementById('gamemodes-scroll-content');
    
    // Create initial gamemode elements - we'll create 4 sets for more reliability
    function createGamemodeElements() {
        for (let i = 0; i < 4; i++) {
            gamemodes.forEach(gamemode => {
                const gamemodeElement = document.createElement('div');
                gamemodeElement.classList.add('gamemode-item');
                gamemodeElement.textContent = gamemode;
                scrollContent.appendChild(gamemodeElement);
            });
        }
    }
    
    createGamemodeElements();
    
    // Calculate the height of a single set of gamemodes
    const singleSetHeight = gamemodes.reduce((height, _, index) => {
        const element = scrollContent.children[index];
        return height + element.offsetHeight + parseInt(getComputedStyle(element).marginBottom, 10);
    }, 0);
    
    let currentPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    
    // Animation function
    function animateScroll() {
        currentPosition -= scrollSpeed;
        
        // When we've scrolled past a complete set, reset position precisely
        if (Math.abs(currentPosition) >= singleSetHeight) {
            // Add exactly one set height to reset position to create seamless loop
            currentPosition += singleSetHeight;
        }
        
        scrollContent.style.transform = `translateY(${currentPosition}px)`;
        requestAnimationFrame(animateScroll);
    }
    
    // Start the animation
    requestAnimationFrame(animateScroll);
}); 