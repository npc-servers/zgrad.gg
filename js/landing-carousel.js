/**
 * Landing Page Content Carousel
 * Cycles through: Default → Latest News → Active Event → Sale → repeat
 * Each state displays for ~15 seconds with smooth transitions
 */

document.addEventListener('DOMContentLoaded', () => {
    initLandingCarousel();
});

// Carousel configuration
const CAROUSEL_CONFIG = {
    rotationInterval: 15000, // 15 seconds per slide
    transitionDuration: 800, // CSS transition duration in ms
    initialDelay: 15000, // Wait 15 seconds before first rotation
};

// Carousel state management
let carouselState = {
    currentIndex: 0,
    items: [], // Will be populated with available content
    intervalId: null,
    isPaused: false,
    isInitialized: false,
};

/**
 * Initialize the landing carousel
 */
async function initLandingCarousel() {
    const landingSection = document.querySelector('.landing-section');
    const landingContainer = document.querySelector('.landing-container');
    if (!landingSection || !landingContainer) return;

    try {
        // Fetch all available content in parallel
        const [latestNews, activeEvents, activeSale] = await Promise.all([
            fetchLatestNews(),
            fetchActiveEvents(),
            fetchActiveSale(),
        ]);

        // Build carousel items array with available content
        // Always start with 'default'
        carouselState.items = [{ type: 'default' }];

        // Add latest news if available (only one news post)
        if (latestNews) {
            carouselState.items.push({ type: 'news', data: latestNews });
        }

        // Add first active event if available (only one event)
        if (activeEvents && activeEvents.length > 0) {
            carouselState.items.push({ type: 'event', data: activeEvents[0] });
        }

        // Add active sale if available
        if (activeSale) {
            carouselState.items.push({ type: 'sale', data: activeSale });
        }

        // Only initialize carousel if we have more than just the default state
        if (carouselState.items.length > 1) {
            createCarouselUI(landingSection);
            carouselState.isInitialized = true;

            // Show progress bar immediately
            const progressBar = document.querySelector('.carousel-progress-bar');
            if (progressBar) {
                progressBar.classList.add('visible');
            }

            // Start the carousel immediately
            startCarousel();

            // Pause on hover for better UX
            setupPauseOnHover();
        }
    } catch (error) {
        console.error('Error initializing landing carousel:', error);
    }
}

/**
 * Fetch the latest news post
 */
async function fetchLatestNews() {
    try {
        const response = await fetch('/api/news/list');
        if (!response.ok) return null;

        const data = await response.json();
        const news = data.news || [];

        // Filter for published, public news that is NOT an event
        const announcements = news.filter(item => 
            item.status === 'published' && 
            item.visibility === 'public' && 
            item.category === 'announcement'
        );

        // Sort by created_at descending and get the first one
        announcements.sort((a, b) => b.created_at - a.created_at);
        
        return announcements.length > 0 ? announcements[0] : null;
    } catch (error) {
        console.error('Error fetching latest news:', error);
        return null;
    }
}

/**
 * Fetch active events
 */
async function fetchActiveEvents() {
    try {
        const response = await fetch('/api/news/list');
        if (!response.ok) return null;

        const data = await response.json();
        const news = data.news || [];
        const now = Date.now();

        // Filter for published, public events that haven't ended
        const activeEvents = news.filter(item => 
            item.status === 'published' && 
            item.visibility === 'public' && 
            item.category === 'event' &&
            (!item.event_end_date || item.event_end_date > now)
        );

        // Sort by end date (soonest ending first)
        activeEvents.sort((a, b) => {
            if (a.event_end_date && b.event_end_date) {
                return a.event_end_date - b.event_end_date;
            }
            return b.created_at - a.created_at;
        });

        return activeEvents;
    } catch (error) {
        console.error('Error fetching active events:', error);
        return null;
    }
}

/**
 * Fetch active sale
 */
async function fetchActiveSale() {
    try {
        const response = await fetch('/api/sales/active');
        if (!response.ok) return null;

        const data = await response.json();
        return data.active ? data.sale : null;
    } catch (error) {
        console.error('Error fetching active sale:', error);
        return null;
    }
}

/**
 * Create carousel UI elements
 */
function createCarouselUI(section) {
    // Create carousel overlay container
    const carouselOverlay = document.createElement('div');
    carouselOverlay.className = 'landing-carousel-overlay';
    carouselOverlay.innerHTML = `
        <div class="carousel-content-wrapper">
            <div class="carousel-content carousel-news" data-type="news">
                <div class="carousel-badge">LATEST NEWS</div>
                <h2 class="carousel-title"></h2>
                <p class="carousel-description"></p>
            </div>
            <div class="carousel-content carousel-event" data-type="event">
                <div class="carousel-badge carousel-badge-event">ACTIVE EVENT</div>
                <div class="carousel-event-countdown">
                    <span class="countdown-label">ENDS IN</span>
                    <span class="countdown-time"></span>
                </div>
                <h2 class="carousel-title"></h2>
                <p class="carousel-description"></p>
            </div>
            <div class="carousel-content carousel-sale" data-type="sale">
                <div class="carousel-badge carousel-badge-sale">STORE SALE</div>
                <div class="carousel-sale-percentage"></div>
                <h2 class="carousel-title"></h2>
                <p class="carousel-description"></p>
            </div>
        </div>
    `;

    // Create carousel link button (positioned at bottom left of section)
    const carouselLink = document.createElement('a');
    carouselLink.className = 'carousel-link';
    carouselLink.href = '#';
    carouselLink.innerHTML = `
        <span class="carousel-link-text">VIEW</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
    `;

    // Create full-width progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'carousel-progress-bar';
    progressBar.innerHTML = `<div class="carousel-progress-fill"></div>`;

    section.appendChild(carouselOverlay);
    section.appendChild(carouselLink);
    section.appendChild(progressBar);

    // Start countdown update interval for events
    setInterval(updateEventCountdown, 1000);
}

/**
 * Start the carousel rotation
 */
function startCarousel() {
    if (carouselState.intervalId) {
        clearInterval(carouselState.intervalId);
    }

    // Reset and start progress bar
    resetProgressBar();

    carouselState.intervalId = setInterval(() => {
        if (!carouselState.isPaused) {
            nextSlide();
        }
    }, CAROUSEL_CONFIG.rotationInterval);

    // Start progress animation
    startProgressAnimation();
}

/**
 * Go to next slide
 */
function nextSlide() {
    const nextIndex = (carouselState.currentIndex + 1) % carouselState.items.length;
    goToSlide(nextIndex);
}

/**
 * Go to a specific slide
 */
function goToSlide(index) {
    if (index === carouselState.currentIndex) return;

    const previousIndex = carouselState.currentIndex;
    carouselState.currentIndex = index;

    const currentItem = carouselState.items[index];
    
    // Update UI
    updateCarouselDisplay(currentItem, previousIndex);
    resetProgressBar();
    
    // Restart the interval
    if (carouselState.intervalId) {
        clearInterval(carouselState.intervalId);
    }
    
    carouselState.intervalId = setInterval(() => {
        if (!carouselState.isPaused) {
            nextSlide();
        }
    }, CAROUSEL_CONFIG.rotationInterval);

    // Restart progress animation
    startProgressAnimation();
}

/**
 * Update the carousel display based on current item
 */
function updateCarouselDisplay(item, previousIndex) {
    const overlay = document.querySelector('.landing-carousel-overlay');
    const defaultContent = document.querySelector('.logo-container');
    const joinContainer = document.querySelector('.join-button-container');
    const carouselLink = document.querySelector('.landing-section > .carousel-link');
    
    if (!overlay) return;

    // Hide all carousel content first
    overlay.querySelectorAll('.carousel-content').forEach(content => {
        content.classList.remove('active');
    });

    if (item.type === 'default') {
        // Show default landing content
        overlay.classList.remove('active');
        if (defaultContent) defaultContent.classList.remove('carousel-hidden');
        if (joinContainer) joinContainer.classList.remove('carousel-hidden');
        if (carouselLink) carouselLink.classList.remove('active');
    } else {
        // Hide default content and show carousel overlay
        if (defaultContent) defaultContent.classList.add('carousel-hidden');
        if (joinContainer) joinContainer.classList.add('carousel-hidden');
        overlay.classList.add('active');

        // Update and show the appropriate content
        const contentEl = overlay.querySelector(`.carousel-${item.type}`);
        if (contentEl) {
            populateCarouselContent(contentEl, item);
            
            // Small delay to ensure content is populated before animation
            setTimeout(() => {
                contentEl.classList.add('active');
                if (carouselLink) carouselLink.classList.add('active');
            }, 50);
        }
    }
}

/**
 * Populate carousel content with data
 */
function populateCarouselContent(element, item) {
    const titleEl = element.querySelector('.carousel-title');
    const descEl = element.querySelector('.carousel-description');
    
    // Get the separate link element
    const linkEl = document.querySelector('.landing-section > .carousel-link');
    const linkTextEl = linkEl?.querySelector('.carousel-link-text');

    if (item.type === 'news' && item.data) {
        if (titleEl) titleEl.textContent = item.data.title || 'News Update';
        if (descEl) descEl.innerHTML = getShortDescription(item.data);
        if (linkEl) {
            linkEl.href = `/news/${item.data.slug}`;
            linkEl.removeAttribute('target');
            linkEl.removeAttribute('rel');
        }
        if (linkTextEl) linkTextEl.textContent = 'READ MORE';
    } else if (item.type === 'event' && item.data) {
        if (titleEl) titleEl.textContent = item.data.title || 'Active Event';
        if (descEl) descEl.innerHTML = getShortDescription(item.data);
        if (linkEl) {
            linkEl.href = `/news/${item.data.slug}`;
            linkEl.removeAttribute('target');
            linkEl.removeAttribute('rel');
        }
        if (linkTextEl) linkTextEl.textContent = 'VIEW EVENT';
        
        // Store end date for countdown
        element.dataset.eventEnd = item.data.event_end_date || '';
        updateEventCountdown();
    } else if (item.type === 'sale' && item.data) {
        const percentageEl = element.querySelector('.carousel-sale-percentage');
        
        if (percentageEl) percentageEl.textContent = `${item.data.percentage}% OFF`;
        if (titleEl) titleEl.textContent = item.data.title || 'Store Sale';
        if (descEl) descEl.innerHTML = sanitizeHtml(item.data.description) || '';
        if (linkTextEl) linkTextEl.textContent = item.data.linkText || 'SHOP NOW';
        if (linkEl) {
            linkEl.href = item.data.linkUrl || 'https://store.zmod.gg';
            linkEl.setAttribute('target', '_blank');
            linkEl.setAttribute('rel', 'noopener');
        }
    }
}

/**
 * Get a short description from news/event data (supports HTML formatting)
 */
function getShortDescription(data) {
    // Prefer loading_screen_description if available
    if (data.loading_screen_description) {
        return sanitizeHtml(data.loading_screen_description);
    }
    
    // Fall back to content
    if (data.content) {
        const sanitized = sanitizeHtml(data.content);
        const plainText = stripHtml(data.content);
        // If too long, truncate
        if (plainText.length > 200) {
            return stripHtml(data.content).substring(0, 200) + '...';
        }
        return sanitized;
    }
    
    return 'Click to learn more...';
}

/**
 * Sanitize HTML - only allow safe formatting tags
 */
function sanitizeHtml(html) {
    if (!html) return '';
    // Remove all tags except allowed formatting ones
    return html
        .replace(/<(?!\/?(?:strong|b|em|i|u|s|br)(?:\s|>|\/|$))[^>]*>/gi, '')
        .replace(/<\/p>\s*<p>/gi, '<br>')
        .replace(/<\/?p>/gi, '')
        .trim();
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

/**
 * Update event countdown display
 */
function updateEventCountdown() {
    const eventContent = document.querySelector('.carousel-event');
    if (!eventContent) return;

    const endDate = parseInt(eventContent.dataset.eventEnd);
    const countdownEl = eventContent.querySelector('.carousel-event-countdown');
    const countdownTime = eventContent.querySelector('.countdown-time');
    const countdownLabel = eventContent.querySelector('.countdown-label');
    
    if (!endDate || !countdownEl || !countdownTime) {
        if (countdownEl) countdownEl.style.display = 'none';
        return;
    }

    const now = Date.now();
    const diff = endDate - now;

    if (diff <= 0) {
        if (countdownLabel) countdownLabel.textContent = '';
        countdownTime.textContent = 'EVENT ENDED';
        return;
    }

    countdownEl.style.display = 'flex';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    countdownTime.textContent = parts.join(' ');
}

/**
 * Reset progress bar animation
 */
function resetProgressBar() {
    const fill = document.querySelector('.carousel-progress-fill');
    if (fill) {
        fill.style.animation = 'none';
        fill.offsetHeight; // Trigger reflow
        fill.style.animation = '';
    }
}

/**
 * Start progress bar animation
 */
function startProgressAnimation() {
    const fill = document.querySelector('.carousel-progress-fill');
    if (fill) {
        fill.style.animation = 'none';
        fill.offsetHeight; // Trigger reflow
        fill.style.animation = `progressFill ${CAROUSEL_CONFIG.rotationInterval}ms linear forwards`;
    }
}

/**
 * Setup pause on hover
 */
function setupPauseOnHover() {
    const overlay = document.querySelector('.landing-carousel-overlay');
    const progressBar = document.querySelector('.carousel-progress-bar');
    
    const pauseElements = [overlay, progressBar].filter(Boolean);
    
    pauseElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            carouselState.isPaused = true;
            const fill = document.querySelector('.carousel-progress-fill');
            if (fill) {
                fill.style.animationPlayState = 'paused';
            }
        });
        
        el.addEventListener('mouseleave', () => {
            carouselState.isPaused = false;
            const fill = document.querySelector('.carousel-progress-fill');
            if (fill) {
                fill.style.animationPlayState = 'running';
            }
        });
    });
}

// Export for potential external use
window.landingCarousel = {
    goToSlide,
    nextSlide,
    pause: () => { carouselState.isPaused = true; },
    resume: () => { carouselState.isPaused = false; },
};

