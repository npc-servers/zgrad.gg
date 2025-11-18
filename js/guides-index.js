// Guides Index JavaScript
// Dynamically fetches and displays all guides

document.addEventListener('DOMContentLoaded', function() {
    initGuidesIndex();
});

async function initGuidesIndex() {
    const guidesGrid = document.getElementById('guidesGrid');
    
    if (!guidesGrid) {
        console.error('Guides grid element not found');
        return;
    }

    try {
        guidesGrid.innerHTML = '<div class="guides-loading">Loading guides...</div>';
        
        // First, fetch the manifest to get list of guides
        const manifest = await fetchGuidesManifest();
        
        if (!manifest || !manifest.guides || manifest.guides.length === 0) {
            guidesGrid.innerHTML = '<div class="guides-error">No guides found.</div>';
            return;
        }
        
        // Then fetch data for each guide
        const guides = await fetchAllGuides(manifest.guides);
        
        if (guides.length === 0) {
            guidesGrid.innerHTML = '<div class="guides-error">No guides found.</div>';
            return;
        }

        displayGuides(guides);
    } catch (error) {
        console.error('Error loading guides:', error);
        guidesGrid.innerHTML = '<div class="guides-error">Failed to load guides. Please try again later.</div>';
    }
}

async function fetchGuidesManifest() {
    try {
        const basePath = window.location.pathname.includes('/guides') 
            ? window.location.pathname.replace(/\/[^/]*$/, '/') 
            : '/guides/';
        
        const manifestUrl = `${basePath}manifest.json`;
        const response = await fetch(manifestUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching guides manifest:', error);
        return null;
    }
}

async function fetchAllGuides(guideList) {
    const guides = [];
    
    for (const guideInfo of guideList) {
        try {
            const guideData = await fetchGuideData(guideInfo.file, guideInfo.slug);
            if (guideData) {
                guides.push(guideData);
            }
        } catch (error) {
            console.warn(`Failed to fetch guide ${guideInfo.file}:`, error);
        }
    }
    
    return guides;
}

async function fetchGuideData(guideFile, slug) {
    try {
        // Get the base path for guides - try both .html and extensionless
        const basePath = window.location.pathname.includes('/guides') 
            ? window.location.pathname.replace(/\/[^/]*$/, '/') 
            : '/guides/';
        
        // Try fetching with .html extension first
        let guideUrl = `${basePath}${guideFile}`;
        let response = await fetch(guideUrl);
        
        // If that fails, try without .html extension (for production builds)
        if (!response.ok && guideFile.endsWith('.html')) {
            guideUrl = `${basePath}${slug}`;
            response = await fetch(guideUrl);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Parse the HTML to extract metadata
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract title
        const titleElement = doc.querySelector('title');
        let title = titleElement ? titleElement.textContent : '';
        
        // Remove " - ZGRAD Help Guide" suffix if present
        title = title.replace(/\s*-\s*ZGRAD.*$/i, '').trim();
        
        // Extract description
        const descriptionMeta = doc.querySelector('meta[name="description"]');
        const description = descriptionMeta ? descriptionMeta.getAttribute('content') : '';
        
        // Extract thumbnail - prioritize dedicated thumbnail meta tag, fallback to og:image
        // Thumbnails are used for:
        // 1. Guide card images in the index page
        // 2. External embeds (via og:image meta tag - should be set in guide HTML)
        const thumbnailMeta = doc.querySelector('meta[name="thumbnail"]');
        let imageUrl = thumbnailMeta ? thumbnailMeta.getAttribute('content') : null;
        
        // Fallback to Open Graph image if no dedicated thumbnail
        // Note: For external embeds to work, guides should also have og:image meta tag set
        if (!imageUrl) {
            const ogImageMeta = doc.querySelector('meta[property="og:image"]');
            imageUrl = ogImageMeta ? ogImageMeta.getAttribute('content') : null;
        }
        
        // Ensure image URL is absolute for proper display
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('//')) {
            // Convert relative URLs to absolute
            if (imageUrl.startsWith('/')) {
                imageUrl = window.location.origin + imageUrl;
            } else {
                // Relative to current guide path
                const basePath = window.location.pathname.includes('/guides') 
                    ? window.location.pathname.replace(/\/[^/]*$/, '/') 
                    : '/guides/';
                imageUrl = window.location.origin + basePath + imageUrl;
            }
        }
        
        // Extract guide title from h1 if available (for display)
        const guideTitleElement = doc.querySelector('.guide-title');
        const displayTitle = guideTitleElement ? guideTitleElement.textContent.trim() : title;
        
        // Extract author from meta tag, default to null (will show ZGRAD)
        const authorMeta = doc.querySelector('meta[name="author"]');
        let author = authorMeta ? authorMeta.getAttribute('content') : null;
        
        // If author is ZGRAD Network or ZGRAD, treat as default (no author)
        if (author && (author.toLowerCase().includes('zgrad network') || author.toLowerCase().trim() === 'zgrad')) {
            author = null;
        }
        
        return {
            title: displayTitle || title,
            description: description,
            imageUrl: imageUrl,
            slug: slug,
            url: `/guides/${slug}`,
            author: author
        };
    } catch (error) {
        console.error(`Error fetching guide data for ${guideFile}:`, error);
        return null;
    }
}

function displayGuides(guides) {
    const guidesGrid = document.getElementById('guidesGrid');
    
    if (guides.length === 0) {
        guidesGrid.innerHTML = '<div class="guides-error">No guides available.</div>';
        return;
    }
    
    guidesGrid.innerHTML = '';
    
    guides.forEach((guide, index) => {
        const guideCard = createGuideCard(guide, index);
        guidesGrid.appendChild(guideCard);
    });
    
    // Animate cards on load
    animateGuideCards();
}

function createGuideCard(guide, index) {
    const card = document.createElement('a');
    card.href = guide.url;
    card.className = 'guide-card';
    card.setAttribute('data-index', index);
    
    const cardContent = `
        ${guide.imageUrl ? `
        <div class="guide-card-image">
            <img src="${guide.imageUrl}" alt="${guide.title}" loading="lazy">
            <div class="guide-card-overlay"></div>
        </div>
        ` : ''}
        <div class="guide-card-content">
            <h3 class="guide-card-title">${escapeHtml(guide.title)}</h3>
            <div class="guide-card-author">
                ${guide.author ? `
                    <span class="guide-card-author-name">${escapeHtml(guide.author)}</span>
                ` : `
                    <img src="/images/logos/zgrad-logopiece-z.png" alt="ZGRAD Logo" class="guide-card-author-logo">
                    <span class="guide-card-author-name">ZGRAD</span>
                `}
            </div>
            <p class="guide-card-description">${escapeHtml(guide.description)}</p>
            <div class="guide-card-link">
                <span>Read Guide</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>
        </div>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateGuideCards() {
    const cards = document.querySelectorAll('.guide-card');
    
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

