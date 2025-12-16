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
                <div class="carousel-cover-image-wrapper">
                    <img class="carousel-cover-image" src="" alt="">
                </div>
                <h2 class="carousel-title"></h2>
                <div class="carousel-author carousel-author-news">
                    <div class="author-avatar-wrapper">
                        <img class="author-avatar" src="" alt="Author">
                    </div>
                    <span class="author-text">Posted by <span class="author-name"></span></span>
                </div>
                <p class="carousel-description"></p>
                <a href="#" class="carousel-link">
                    <span class="carousel-link-text">READ MORE</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
            <div class="carousel-content carousel-event" data-type="event">
                <div class="carousel-cover-image-wrapper">
                    <img class="carousel-cover-image" src="" alt="">
                </div>
                <h2 class="carousel-title"></h2>
                <div class="carousel-author carousel-author-event">
                    <div class="author-avatar-wrapper">
                        <img class="author-avatar" src="" alt="Host">
                    </div>
                    <span class="author-text">Hosted by <span class="author-name"></span></span>
                </div>
                <p class="carousel-description"></p>
                <a href="#" class="carousel-link">
                    <span class="carousel-link-text">VIEW EVENT</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
            <div class="carousel-content carousel-sale" data-type="sale">
                <h2 class="carousel-title"></h2>
                <p class="carousel-description"></p>
                <a href="#" class="carousel-link">
                    <span class="carousel-link-text">SHOP NOW</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        </div>
    `;

    // Create badges and special elements as direct children of landing-section
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'carousel-badge-container';
    badgeContainer.innerHTML = `
        <div class="carousel-badge carousel-badge-news" data-type="news">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
                <path fill="currentColor" fill-rule="evenodd" d="M25.5.5a2 2 0 0 0-2 2v3a2 2 0 1 0 4 0v-3a2 2 0 0 0-2-2m-17 21a2 2 0 1 1 0-4h3a2 2 0 1 1 0 4zm34 0a2 2 0 1 0 0-4h-3a2 2 0 1 0 0 4zM12.064 8.895a2 2 0 0 1 2.829-2.828l2.121 2.12a2 2 0 1 1-2.828 2.83zm26.87-2.828a2 2 0 0 1 0 2.828l-2.122 2.121a2 2 0 1 1-2.828-2.828l2.121-2.121a2 2 0 0 1 2.829 0M25.049 10.04a1.5 1.5 0 0 1 2.119.095l.003.003l.003.004l.01.01l.03.034l.1.117q.13.15.368.447c.319.4.785 1.008 1.398 1.874c1.225 1.73 3.042 4.491 5.446 8.656c2.405 4.164 3.887 7.117 4.773 9.045a41 41 0 0 1 .924 2.147a18 18 0 0 1 .254.687l.014.043l.005.014l.002.007v.002a1.5 1.5 0 0 1-2.85.935c-1.245.418-2.51.83-3.782 1.233a72 72 0 0 0-1.257-2.881a98 98 0 0 0-4.047-7.789a98 98 0 0 0-4.72-7.399a72 72 0 0 0-1.865-2.526c.985-.9 1.974-1.79 2.959-2.659a1.5 1.5 0 0 1 .113-2.099m5.81 25.93q.068.159.133.318c-2.04.625-4.07 1.224-6.032 1.786l.277 1.032a6.59 6.59 0 1 1-12.733 3.412l-.266-.992c-.98.25-1.82.463-2.49.63c-1.649.412-3.445-.144-4.503-1.582c-.38-.518-.805-1.13-1.147-1.724a19 19 0 0 1-.92-1.855c-.716-1.635-.3-3.469.882-4.691c2.61-2.7 8.892-9.116 15.704-15.464l.207.27c.335.442.822 1.098 1.419 1.944a95 95 0 0 1 4.574 7.17a95 95 0 0 1 3.922 7.546c.435.94.76 1.69.974 2.2Zm-14.75 4.546l.259.966a2.59 2.59 0 1 0 5.005-1.34l-.263-.982c-1.787.495-3.472.95-5.001 1.356" clip-rule="evenodd"/>
            </svg>
            <span>LATEST NEWS</span>
        </div>
        <div class="carousel-news-date" data-type="news"></div>
        <div class="carousel-badge carousel-badge-event" data-type="event">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path fill="currentColor" d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm0 0V6zm7 6q-.425 0-.712-.288T11 13t.288-.712T12 12t.713.288T13 13t-.288.713T12 14m-4 0q-.425 0-.712-.288T7 13t.288-.712T8 12t.713.288T9 13t-.288.713T8 14m8 0q-.425 0-.712-.288T15 13t.288-.712T16 12t.713.288T17 13t-.288.713T16 14m-4 4q-.425 0-.712-.288T11 17t.288-.712T12 16t.713.288T13 17t-.288.713T12 18m-4 0q-.425 0-.712-.288T7 17t.288-.712T8 16t.713.288T9 17t-.288.713T8 18m8 0q-.425 0-.712-.288T15 17t.288-.712T16 16t.713.288T17 17t-.288.713T16 18"/>
            </svg>
            <span>ACTIVE EVENT</span>
        </div>
        <div class="carousel-event-countdown" data-type="event">
            <span class="countdown-label">ENDS IN</span>
            <span class="countdown-time"></span>
        </div>
        <div class="carousel-sale-percentage" data-type="sale">
            <img src="/images/textures/circlular-splatter.png" alt="" class="sale-splatter-image">
            <span class="sale-percentage-text"></span>
        </div>
        <div class="carousel-sale-countdown" data-type="sale">
            <span class="sale-countdown-label">UNTIL</span>
            <span class="sale-countdown-date"></span>
        </div>
    `;

    // Create full-width progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'carousel-progress-bar';
    progressBar.innerHTML = `<div class="carousel-progress-fill"></div>`;

    section.appendChild(badgeContainer);
    section.appendChild(carouselOverlay);
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
    
    // Get all badge elements
    const allBadges = document.querySelectorAll('.landing-section .carousel-badge');
    const countdown = document.querySelector('.landing-section .carousel-event-countdown');
    const salePercentage = document.querySelector('.landing-section .carousel-sale-percentage');
    const saleCountdown = document.querySelector('.landing-section .carousel-sale-countdown');
    const newsDate = document.querySelector('.landing-section .carousel-news-date');
    
    if (!overlay) return;

    // Hide all carousel content first
    overlay.querySelectorAll('.carousel-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Hide all badges and special elements
    allBadges.forEach(badge => badge.classList.remove('active'));
    if (countdown) countdown.classList.remove('active');
    if (salePercentage) salePercentage.classList.remove('active');
    if (saleCountdown) saleCountdown.classList.remove('active');
    if (newsDate) newsDate.classList.remove('active');

    if (item.type === 'default') {
        // Show default landing content
        overlay.classList.remove('active');
        if (defaultContent) defaultContent.classList.remove('carousel-hidden');
        if (joinContainer) joinContainer.classList.remove('carousel-hidden');
    } else {
        // Hide default content and show carousel overlay
        if (defaultContent) defaultContent.classList.add('carousel-hidden');
        if (joinContainer) joinContainer.classList.add('carousel-hidden');
        overlay.classList.add('active');
        
        // Show the appropriate badge
        const badge = document.querySelector(`.landing-section .carousel-badge-${item.type}`);
        if (badge) badge.classList.add('active');
        
        // Show and populate news date
        if (item.type === 'news' && newsDate && item.data) {
            const date = new Date(item.data.created_at);
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
            newsDate.textContent = `Posted ${formattedDate}`;
            newsDate.classList.add('active');
        }
        
        // Show countdown for events
        if (item.type === 'event' && countdown) {
            countdown.classList.add('active');
        }
        
        // Show and populate sale percentage
        if (item.type === 'sale' && salePercentage && item.data) {
            const percentageText = salePercentage.querySelector('.sale-percentage-text');
            // Strip any existing % sign from the percentage value
            const percentValue = String(item.data.percentage || '').replace(/%/g, '');
            if (percentageText) percentageText.innerHTML = `${percentValue}%<br>OFF`;
            salePercentage.classList.add('active');
            
            // Show sale countdown with end date (API returns camelCase: endDate)
            if (saleCountdown && item.data.endDate) {
                const countdownDate = saleCountdown.querySelector('.sale-countdown-date');
                if (countdownDate) {
                    const endDate = new Date(item.data.endDate);
                    const options = { month: 'short', day: 'numeric' };
                    countdownDate.textContent = endDate.toLocaleDateString('en-US', options).toUpperCase();
                }
                saleCountdown.classList.add('active');
            }
        }

        // Update and show the appropriate content
        const contentEl = overlay.querySelector(`.carousel-${item.type}`);
        if (contentEl) {
            populateCarouselContent(contentEl, item);
            
            // Small delay to ensure content is populated before animation
            setTimeout(() => {
                contentEl.classList.add('active');
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
    
    // Get the link element inside this content panel
    const linkEl = element.querySelector('.carousel-link');
    const linkTextEl = linkEl?.querySelector('.carousel-link-text');

    if (item.type === 'news' && item.data) {
        if (titleEl) titleEl.textContent = item.data.title || 'News Update';
        
        // Populate cover image
        const coverWrapper = element.querySelector('.carousel-cover-image-wrapper');
        const coverImg = element.querySelector('.carousel-cover-image');
        if (coverWrapper && coverImg) {
            if (item.data.cover_image) {
                coverImg.src = item.data.cover_image;
                coverImg.alt = item.data.title || 'News Cover';
                coverWrapper.classList.add('has-image');
            } else {
                coverWrapper.classList.remove('has-image');
                coverImg.src = '';
            }
        }
        
        // Populate author info
        const authorEl = element.querySelector('.carousel-author');
        const avatarEl = authorEl?.querySelector('.author-avatar');
        const nameEl = authorEl?.querySelector('.author-name');
        
        if (authorEl && item.data.author_name) {
            if (avatarEl && item.data.author_avatar && item.data.author_id) {
                avatarEl.src = `https://cdn.discordapp.com/avatars/${item.data.author_id}/${item.data.author_avatar}.png`;
                avatarEl.alt = item.data.author_name;
                avatarEl.onerror = function() { this.src = '/images/logos/zgrad-logopiece-z.png'; };
            } else if (avatarEl) {
                avatarEl.src = '/images/logos/zgrad-logopiece-z.png';
                avatarEl.alt = item.data.author_name || 'ZGRAD';
            }
            if (nameEl) nameEl.textContent = item.data.author_name;
        }
        
        if (descEl) descEl.innerHTML = getShortDescription(item.data);
        if (linkEl) {
            linkEl.href = `/news/${item.data.slug}`;
            linkEl.removeAttribute('target');
            linkEl.removeAttribute('rel');
        }
        if (linkTextEl) linkTextEl.textContent = 'READ MORE';
    } else if (item.type === 'event' && item.data) {
        if (titleEl) titleEl.textContent = item.data.title || 'Active Event';
        
        // Populate cover image
        const coverWrapper = element.querySelector('.carousel-cover-image-wrapper');
        const coverImg = element.querySelector('.carousel-cover-image');
        if (coverWrapper && coverImg) {
            if (item.data.cover_image) {
                coverImg.src = item.data.cover_image;
                coverImg.alt = item.data.title || 'Event Cover';
                coverWrapper.classList.add('has-image');
            } else {
                coverWrapper.classList.remove('has-image');
                coverImg.src = '';
            }
        }
        
        // Populate host info
        const authorEl = element.querySelector('.carousel-author');
        const avatarEl = authorEl?.querySelector('.author-avatar');
        const nameEl = authorEl?.querySelector('.author-name');
        
        if (authorEl && item.data.author_name) {
            if (avatarEl && item.data.author_avatar && item.data.author_id) {
                avatarEl.src = `https://cdn.discordapp.com/avatars/${item.data.author_id}/${item.data.author_avatar}.png`;
                avatarEl.alt = item.data.author_name;
                avatarEl.onerror = function() { this.src = '/images/logos/zgrad-logopiece-z.png'; };
            } else if (avatarEl) {
                avatarEl.src = '/images/logos/zgrad-logopiece-z.png';
                avatarEl.alt = item.data.author_name || 'ZGRAD';
            }
            if (nameEl) nameEl.textContent = item.data.author_name;
        }
        
        if (descEl) descEl.innerHTML = getShortDescription(item.data);
        if (linkEl) {
            linkEl.href = `/news/${item.data.slug}`;
            linkEl.removeAttribute('target');
            linkEl.removeAttribute('rel');
        }
        if (linkTextEl) linkTextEl.textContent = 'VIEW EVENT';
        
        // Store end date for countdown on the countdown element itself
        const countdown = document.querySelector('.landing-section .carousel-event-countdown');
        if (countdown) {
            countdown.dataset.eventEnd = item.data.event_end_date || '';
        }
        updateEventCountdown();
    } else if (item.type === 'sale' && item.data) {
        if (titleEl) titleEl.textContent = item.data.title || 'Store Sale';
        if (descEl) descEl.innerHTML = sanitizeHtml(item.data.description) || '';
        if (linkTextEl) linkTextEl.textContent = 'VISIT STORE';
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
    const countdownEl = document.querySelector('.landing-section .carousel-event-countdown');
    if (!countdownEl) return;

    const endDate = parseInt(countdownEl.dataset.eventEnd);
    const countdownTime = countdownEl.querySelector('.countdown-time');
    const countdownLabel = countdownEl.querySelector('.countdown-label');
    
    if (!endDate || !countdownTime) {
        countdownEl.style.display = 'none';
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

