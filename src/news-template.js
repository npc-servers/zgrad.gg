// Entry point for news article template page
import '../css/main.css';
import '../css/navbar.css';
import '../css/news-article.css';
import '../css/footer.css';

// Import page scripts
import '../js/tracking.js';
import '../js/navbar.js';
import '../js/footer.js';

/**
 * Format countdown time from milliseconds
 */
function formatCountdown(diff) {
    if (diff <= 0) return 'EVENT ENDED';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return `ENDS IN ${parts.join(' ')}`;
}

/**
 * Initialize event countdown timer
 */
function initEventCountdown() {
    const countdownEl = document.querySelector('.news-article-event-countdown');
    
    if (!countdownEl) return;
    
    const endTime = parseInt(countdownEl.getAttribute('data-end'), 10);
    if (!endTime) return;
    
    const countdownTextEl = countdownEl.querySelector('.countdown-text');
    if (!countdownTextEl) return;
    
    // Update immediately
    const updateCountdown = () => {
        const now = Date.now();
        const diff = endTime - now;
        
        if (diff <= 0) {
            // Event has ended - replace with ended state
            countdownEl.outerHTML = `
                <span class="news-article-event-ended">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    EVENT ENDED
                </span>
            `;
            return false;
        }
        
        countdownTextEl.textContent = formatCountdown(diff);
        return true;
    };
    
    // Initial update
    if (updateCountdown()) {
        // Start interval
        const intervalId = setInterval(() => {
            if (!updateCountdown()) {
                clearInterval(intervalId);
            }
        }, 1000);
    }
}

// Initialize share buttons and countdown
document.addEventListener('DOMContentLoaded', () => {
    const shareTwitter = document.getElementById('shareTwitter');
    const shareDiscord = document.getElementById('shareDiscord');
    
    if (shareTwitter) {
        shareTwitter.addEventListener('click', (e) => {
            e.preventDefault();
            const title = document.querySelector('.news-article-title')?.textContent || 'Check out this news!';
            const url = window.location.href;
            const text = encodeURIComponent(`${title} ${url}`);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
        });
    }
    
    if (shareDiscord) {
        shareDiscord.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://discord.gg/npc', '_blank');
        });
    }
    
    // Initialize event countdown timer
    initEventCountdown();
});

console.log('ZGRAD news article page initialized with Vite');
