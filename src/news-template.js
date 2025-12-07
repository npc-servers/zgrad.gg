// Entry point for news article template page
import '../css/main.css';
import '../css/navbar.css';
import '../css/news-article.css';
import '../css/footer.css';

// Import page scripts
import '../js/tracking.js';
import '../js/navbar.js';
import '../js/footer.js';

// Initialize share buttons
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
});

console.log('ZGRAD news article page initialized with Vite');
