// News Index JavaScript
// Dynamically fetches and displays news & events in a wide horizontal card layout

document.addEventListener('DOMContentLoaded', function() {
    initNewsIndex();
});

// Store all news items for filtering
let allNewsItems = [];
let currentFilter = 'all';

async function initNewsIndex() {
    const newsList = document.getElementById('newsList');
    
    if (!newsList) {
        console.error('News list element not found');
        return;
    }

    try {
        // Fetch news from API
        const response = await fetch('/api/news/list');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter to only published and public news
        allNewsItems = (data.news || []).filter(item => 
            item.status === 'published' && item.visibility === 'public'
        );
        
        // Sort: active events first, then by created_at descending
        allNewsItems.sort((a, b) => {
            const now = Date.now();
            const aIsActiveEvent = a.category === 'event' && a.event_end_date && a.event_end_date > now;
            const bIsActiveEvent = b.category === 'event' && b.event_end_date && b.event_end_date > now;
            
            // Active events come first
            if (aIsActiveEvent && !bIsActiveEvent) return -1;
            if (!aIsActiveEvent && bIsActiveEvent) return 1;
            
            // Among active events, sort by end date (soonest ending first)
            if (aIsActiveEvent && bIsActiveEvent) {
                return a.event_end_date - b.event_end_date;
            }
            
            // For everything else, sort by created_at descending
            return b.created_at - a.created_at;
        });
        
        // Display the news
        displayNews(allNewsItems);
        
        // Initialize filter buttons
        initFilterButtons();
        
    } catch (error) {
        console.error('Error loading news:', error);
        newsList.innerHTML = `
            <div class="news-error">
                <p>Failed to load news. Please try again later.</p>
            </div>
        `;
    }
}

function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.news-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Get filter value and apply
            currentFilter = button.getAttribute('data-filter');
            filterNews(currentFilter);
        });
    });
}

function filterNews(filter) {
    let filteredItems;
    
    if (filter === 'all') {
        filteredItems = [...allNewsItems];
    } else {
        filteredItems = allNewsItems.filter(item => item.category === filter);
    }
    
    // Re-apply sorting: active events first, then by created_at
    const now = Date.now();
    filteredItems.sort((a, b) => {
        const aIsActiveEvent = a.category === 'event' && a.event_end_date && a.event_end_date > now;
        const bIsActiveEvent = b.category === 'event' && b.event_end_date && b.event_end_date > now;
        
        // Active events come first
        if (aIsActiveEvent && !bIsActiveEvent) return -1;
        if (!aIsActiveEvent && bIsActiveEvent) return 1;
        
        // Among active events, sort by end date (soonest ending first)
        if (aIsActiveEvent && bIsActiveEvent) {
            return a.event_end_date - b.event_end_date;
        }
        
        // For everything else, sort by created_at descending
        return b.created_at - a.created_at;
    });
    
    displayNews(filteredItems);
}

function displayNews(newsItems) {
    const newsList = document.getElementById('newsList');
    
    if (newsItems.length === 0) {
        newsList.innerHTML = `
            <div class="news-empty">
                <svg class="news-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h10"/>
                </svg>
                <h3>No news found</h3>
                <p>Check back later for updates and announcements!</p>
            </div>
        `;
        return;
    }
    
    newsList.innerHTML = '';
    
    newsItems.forEach((news, index) => {
        const newsCard = createNewsCard(news, index);
        newsList.appendChild(newsCard);
    });
    
    // Animate cards
    animateNewsCards();
    
    // Start countdown timers for events
    startCountdownTimers();
}

function createNewsCard(news, index) {
    const card = document.createElement('a');
    card.href = `/news/${news.slug}`;
    card.className = 'news-card';
    card.setAttribute('data-category', news.category);
    card.setAttribute('data-index', index);
    
    // Build author avatar URL
    let authorAvatarUrl = '/images/logos/zgrad-logopiece-z.png';
    if (news.author_avatar && news.author_id) {
        authorAvatarUrl = `https://cdn.discordapp.com/avatars/${news.author_id}/${news.author_avatar}.png`;
    }
    
    // Format dates
    const createdDate = formatDate(news.created_at);
    const eventDates = formatEventDates(news.event_start_date, news.event_end_date, news.id);
    
    // Get category info
    const categoryInfo = getCategoryInfo(news.category);
    
    // Truncate description from content if no dedicated description
    const description = getNewsDescription(news);
    
    const cardContent = `
        <div class="news-card-image">
            ${news.cover_image ? `
                <img src="${escapeHtml(news.cover_image)}" alt="${escapeHtml(news.title)}" loading="lazy">
                <div class="news-card-image-overlay"></div>
            ` : `
                <div class="news-card-image-placeholder">
                    ${categoryInfo.icon}
                </div>
            `}
        </div>
        <div class="news-card-content">
            <div>
                <div class="news-card-header">
                    <h2 class="news-card-title">${escapeHtml(news.title)}</h2>
                    <span class="news-card-category category-${news.category}">
                        ${categoryInfo.smallIcon}
                        ${categoryInfo.label}
                    </span>
                </div>
                <p class="news-card-description">${escapeHtml(description)}</p>
            </div>
            <div class="news-card-meta">
                <div class="news-card-author">
                    ${news.category === 'event' ? '<span class="news-card-hosted-by">Hosted by</span>' : ''}
                    <span class="news-card-avatar-wrapper">
                        <img src="${authorAvatarUrl}" alt="${escapeHtml(news.author_name || 'ZGRAD')}" class="news-card-author-avatar" onerror="this.src='/images/logos/zgrad-logopiece-z.png'">
                    </span>
                    <span class="news-card-author-name">${escapeHtml(news.author_name || 'ZGRAD')}</span>
                </div>
                ${news.category === 'event' && eventDates ? `
                    <div class="news-card-event-dates">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${eventDates}
                    </div>
                ` : `
                    <span class="news-card-date">${createdDate}</span>
                `}
                <div class="news-card-link">
                    <span>VIEW</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

function getCategoryInfo(category) {
    const categories = {
        announcement: {
            label: 'Announcement',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>`,
            smallIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>`
        },
        event: {
            label: 'Event',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>`,
            smallIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>`
        }
    };
    
    return categories[category] || categories.announcement;
}

function getNewsDescription(news) {
    // Helper to strip HTML and get plain text
    const stripHtml = (html) => {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    };
    
    // If there's a loading_screen_description, use it as a short description
    if (news.loading_screen_description) {
        let text = stripHtml(news.loading_screen_description);
        
        // Truncate to ~200 characters
        if (text.length > 200) {
            text = text.substring(0, 200).trim() + '...';
        }
        
        return text;
    }
    
    // Otherwise, extract from content (strip HTML and truncate)
    if (news.content) {
        let text = stripHtml(news.content);
        
        // Truncate to ~200 characters
        if (text.length > 200) {
            text = text.substring(0, 200).trim() + '...';
        }
        
        return text;
    }
    
    return 'Click to read more...';
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatEventDates(startDate, endDate, newsId) {
    if (!startDate && !endDate) return null;
    
    const now = Date.now();
    
    // If event has an end date and hasn't ended yet, show countdown
    if (endDate && endDate > now) {
        return `<span class="event-countdown" data-end="${endDate}" data-news-id="${newsId}">ENDS IN ${formatCountdown(endDate)}</span>`;
    }
    
    // If event has ended
    if (endDate && endDate <= now) {
        return '<span class="event-ended">EVENT ENDED</span>';
    }
    
    // If only start date, show it
    if (startDate) {
        const start = new Date(startDate);
        const formatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        return `<span class="event-start-date">STARTS ${start.toLocaleDateString('en-US', formatOptions)}</span>`;
    }
    
    return null;
}

function formatCountdown(endTimestamp) {
    const now = Date.now();
    const diff = endTimestamp - now;
    
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
    
    return parts.join(' ');
}

// Start countdown timers for all event cards
function startCountdownTimers() {
    setInterval(() => {
        const countdowns = document.querySelectorAll('.event-countdown');
        countdowns.forEach(el => {
            const endTime = parseInt(el.getAttribute('data-end'), 10);
            if (endTime) {
                const now = Date.now();
                if (endTime > now) {
                    el.textContent = `ENDS IN ${formatCountdown(endTime)}`;
                } else {
                    el.textContent = 'EVENT ENDED';
                    el.classList.remove('event-countdown');
                    el.classList.add('event-ended');
                }
            }
        });
    }, 1000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateNewsCards() {
    const cards = document.querySelectorAll('.news-card');
    
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
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}
