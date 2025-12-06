// Updates Page JavaScript - Handles loading and displaying Discord updates

let currentOffset = 0;
const UPDATES_PER_PAGE = 20;
let isLoading = false;
let hasMore = true;
let autoRefreshInterval = null;

// Check if auto-sync is needed (first load with no updates)
async function checkAndAutoSync() {
    try {
        const response = await fetch('/api/updates/auto-sync');
        const data = await response.json();
        
        if (data.synced) {
            console.log(`[Updates] Auto-initialized with ${data.count} updates from Discord`);
        } else if (data.error) {
            console.warn('[Updates] Auto-sync failed:', data.error);
        }
    } catch (error) {
        console.error('[Updates] Auto-sync check failed:', error);
    }
}

// Track last visit timestamp
const LAST_VISIT_KEY = 'zgrad_updates_last_visit';
let lastVisitTimestamp = 0;

// Initialize updates page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Updates] Initializing updates page...');
    
    // Get last visit timestamp
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    lastVisitTimestamp = stored ? parseInt(stored) : 0;
    console.log('[Updates] Last visit:', lastVisitTimestamp ? new Date(lastVisitTimestamp).toLocaleString() : 'First visit');
    
    // Auto-sync on first load if needed (will initialize with existing Discord messages)
    await checkAndAutoSync();
    
    // Load updates
    await loadUpdates();
    
    // Setup continuous monitoring
    setupAutoRefresh();
    setupLoadMore();
    
    // Update last visit timestamp when user leaves
    window.addEventListener('beforeunload', () => {
        localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    });
});

// Load updates from API
async function loadUpdates(append = false) {
    if (isLoading) return;
    
    isLoading = true;
    const timeline = document.getElementById('updatesTimeline');
    
    if (!append) {
        timeline.innerHTML = '<div class="updates-loading"><div class="loading-spinner"></div><p>Loading updates...</p></div>';
    }
    
    try {
        const response = await fetch(`/api/updates/list?limit=${UPDATES_PER_PAGE}&offset=${currentOffset}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load updates');
        }
        
        console.log('[Updates] Loaded updates:', {
            count: data.updates.length,
            offset: currentOffset,
            hasMore: data.hasMore
        });
        
        // Only show "Load More" if we actually got results and API says there's more
        hasMore = data.hasMore && data.updates.length > 0;
        
        if (!append) {
            timeline.innerHTML = '';
        } else {
            // Remove loading indicator
            const loadingIndicator = timeline.querySelector('.updates-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
        
        if (data.updates.length === 0 && !append) {
            displayEmptyState(timeline);
        } else if (data.updates.length > 0) {
            data.updates.forEach(update => {
                const updateElement = createUpdateElement(update);
                timeline.appendChild(updateElement);
            });
            
            currentOffset += data.updates.length;
        } else if (append && data.updates.length === 0) {
            // No more updates to load
            hasMore = false;
        }
        
        // Show/hide load more button
        updateLoadMoreButton();
    } catch (error) {
        console.error('[Updates] Error loading updates:', error);
        
        // Only show error in timeline if it's the initial load
        if (!append) {
            timeline.innerHTML = `
                <div class="updates-empty">
                    <h3>Failed to Load Updates</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        } else {
            // Just disable the button if we fail while loading more
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Error loading more';
                setTimeout(() => {
                    loadMoreBtn.textContent = 'Load More Updates';
                    loadMoreBtn.disabled = false;
                }, 3000);
            }
        }
    } finally {
        isLoading = false;
        updateLoadMoreButton(); // Ensure button state is updated
    }
}

// Create update element
function createUpdateElement(update) {
    const item = document.createElement('div');
    item.className = 'update-item';
    item.dataset.updateId = update.id;
    
    // Check if update is new (posted after last visit)
    // Don't mark as new on first visit (lastVisitTimestamp === 0)
    const isNew = lastVisitTimestamp > 0 && update.timestamp > lastVisitTimestamp;
    if (isNew) {
        item.classList.add('update-new');
    }
    
    // Format date
    const date = new Date(update.timestamp);
    const formattedDate = formatDate(date);
    const relativeTime = getRelativeTime(date);
    
    // Avatar URL - use author_id and avatar hash if available
    let avatarUrl;
    if (update.author_id && update.author_avatar && update.author_avatar !== 'null') {
        avatarUrl = `https://cdn.discordapp.com/avatars/${update.author_id}/${update.author_avatar}.png`;
    } else if (update.author_id) {
        // Calculate default avatar index based on discriminator or user ID
        const defaultAvatarIndex = (BigInt(update.author_id) >> 22n) % 6n;
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    } else {
        avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
    
    console.log('[Updates] Avatar debug:', {
        author_id: update.author_id,
        author_avatar: update.author_avatar,
        author_username: update.author_username,
        avatarUrl: avatarUrl
    });
    
    // Parse markdown-like content
    const processedContent = processContent(update.content);
    
    item.innerHTML = `
        <div class="update-header">
            <div class="update-author">
                <img src="${avatarUrl}" alt="${escapeHtml(update.author_username)}" class="update-author-avatar">
                <span>${escapeHtml(update.author_username)}</span>
                ${isNew ? '<span class="update-new-badge">NEW</span>' : ''}
            </div>
            <div class="update-date" title="${formattedDate}">${relativeTime}</div>
        </div>
        
        ${update.content ? `<div class="update-content">${processedContent}</div>` : ''}
        
        ${update.attachments && update.attachments.length > 0 ? `
            <div class="update-attachments">
                ${update.attachments.map(att => {
                    if (att.contentType && (att.contentType.startsWith('image/') || att.contentType === 'image/gif')) {
                        return `<a href="${att.url}" target="_blank" rel="noopener" class="update-attachment">
                            <img src="${att.url}" alt="${escapeHtml(att.filename)}" loading="lazy" onerror="this.parentElement.style.display='none'">
                        </a>`;
                    } else if (att.contentType && att.contentType.startsWith('video/')) {
                        return `<video controls class="update-attachment" style="max-width: 600px; border-radius: 8px;">
                            <source src="${att.url}" type="${att.contentType}">
                        </video>`;
                    }
                    return '';
                }).join('')}
            </div>
        ` : ''}
        
        ${update.reactions && update.reactions.length > 0 ? `
            <div class="update-reactions">
                ${update.reactions.map(reaction => {
                    const emoji = reaction.emoji.id 
                        ? `<img src="https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}" alt="${escapeHtml(reaction.emoji.name)}" class="reaction-emoji-custom">`
                        : `<span class="reaction-emoji-unicode">${reaction.emoji.name}</span>`;
                    return `<div class="update-reaction" title="${escapeHtml(reaction.emoji.name)}">${emoji}<span class="reaction-count">${reaction.count}</span></div>`;
                }).join('')}
            </div>
        ` : ''}
        
        <div class="update-footer">
            <a href="${update.message_url}" target="_blank" rel="noopener" class="update-link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                View on Discord
            </a>
        </div>
    `;
    
    return item;
}

// Process content (basic markdown support + Discord CDN embeds + changelog categories)
function processContent(content) {
    if (!content) return '';
    
    let processed = escapeHtml(content);
    
    // Remove Discord references (mentions, emojis, channels, etc.)
    // These become &lt; and &gt; after escapeHtml()
    processed = processed.replace(/&lt;[@#:][^&]+?&gt;/g, '');
    
    // Discord CDN attachment URLs - REMOVE them from text content (they expire and 404)
    // Attachments are already shown from the attachments field which has proper URLs
    processed = processed.replace(
        /https:\/\/cdn\.discordapp\.com\/attachments\/[\d]+\/[\d]+\/[^\s<]+(\?[^\s<]*)?/gi,
        ''
    );
    
    // Discord message links - convert to regular clickable links (same as other URLs)
    // These will be styled by the general link CSS
    // Regex will be handled by the general URL auto-linking below
    
    // Changelog categories and formatting - detect lines starting with special chars
    // Process line by line to add category badges or bullet points
    const lines = processed.split('\n');
    processed = lines.map(line => {
        const trimmedLine = line.trim();
        
        // ADDED: lines starting with + or \+
        if (trimmedLine.startsWith('+')) {
            const content = trimmedLine.substring(1).trim();
            return `<span class="changelog-badge changelog-added">ADDED</span> ${content}`;
        }
        if (trimmedLine.startsWith('\\+')) {
            const content = trimmedLine.substring(2).trim();
            return `<span class="changelog-badge changelog-added">ADDED</span> ${content}`;
        }
        
        // CHANGED: lines starting with × or x
        if (trimmedLine.startsWith('×') || trimmedLine.startsWith('x')) {
            const content = trimmedLine.substring(1).trim();
            return `<span class="changelog-badge changelog-changed">CHANGED</span> ${content}`;
        }
        
        // REMOVED: lines starting with - or \-
        if (trimmedLine.startsWith('-')) {
            const content = trimmedLine.substring(1).trim();
            return `<span class="changelog-badge changelog-removed">REMOVED</span> ${content}`;
        }
        if (trimmedLine.startsWith('\\-')) {
            const content = trimmedLine.substring(2).trim();
            return `<span class="changelog-badge changelog-removed">REMOVED</span> ${content}`;
        }
        
        // BULLET POINT: lines starting with * or \*
        if (trimmedLine.startsWith('*')) {
            const content = trimmedLine.substring(1).trim();
            return `<span class="bullet-point">•</span> ${content}`;
        }
        if (trimmedLine.startsWith('\\*')) {
            const content = trimmedLine.substring(2).trim();
            return `<span class="bullet-point">•</span> ${content}`;
        }
        
        return line;
    }).join('\n');
    
    // Bold: **text** or __text__
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* (but not _text_ since underscores are common in variable names)
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Code: `code`
    processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Links: [text](url) - only process if URL exists, otherwise just show text
    // Use a unique placeholder to prevent double-linking
    const linkPlaceholders = [];
    processed = processed.replace(/\[([^\]]+)\]\(([^)]*)\)/g, (match, text, url) => {
        if (url && url.trim()) {
            const placeholder = `__LINK_PLACEHOLDER_${linkPlaceholders.length}__`;
            linkPlaceholders.push(`<a href="${url}" target="_blank" rel="noopener">${text}</a>`);
            return placeholder;
        }
        return text; // Just return the text without brackets if no URL
    });
    
    // Auto-link plain URLs (that aren't already in <a> or <img> tags or placeholders)
    // Add word-break for long URLs
    processed = processed.replace(
        /(?<!href="|src="|class="|__LINK_PLACEHOLDER_)https?:\/\/[^\s<]+/g, 
        '<a href="$&" target="_blank" rel="noopener" style="word-break: break-all;">$&</a>'
    );
    
    // Replace link placeholders with actual links
    linkPlaceholders.forEach((link, index) => {
        processed = processed.replace(`__LINK_PLACEHOLDER_${index}__`, link);
    });
    
    // Convert line breaks to paragraphs
    const paragraphs = processed.split('\n\n').filter(p => p.trim());
    if (paragraphs.length > 1) {
        processed = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    } else {
        processed = processed.replace(/\n/g, '<br>');
    }
    
    return processed;
}

// Display empty state
function displayEmptyState(container) {
    container.innerHTML = `
        <div class="updates-empty">
            <svg class="updates-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No Updates Yet</h3>
            <p>Check back soon for the latest announcements and changes</p>
        </div>
    `;
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Refresh every 5 minutes
    autoRefreshInterval = setInterval(() => {
        console.log('[Updates] Auto-refreshing updates...');
        refreshUpdates();
    }, 5 * 60 * 1000);
    
    // Clear interval when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        } else {
            if (!autoRefreshInterval) {
                setupAutoRefresh();
                refreshUpdates();
            }
        }
    });
}

// Refresh updates (check for new ones and update reactions)
async function refreshUpdates() {
    try {
        // First, refresh reactions for recent updates
        try {
            const refreshResponse = await fetch('/api/updates/refresh', {
                method: 'POST'
            });
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.refreshed) {
                    console.log(`[Updates] Refreshed reactions for ${refreshData.count} update(s)`);
                }
            }
        } catch (refreshError) {
            console.warn('[Updates] Failed to refresh reactions:', refreshError);
        }
        
        // Then check for new updates
        const response = await fetch(`/api/updates/list?limit=5&offset=0`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to refresh updates');
        }
        
        const timeline = document.getElementById('updatesTimeline');
        const existingIds = new Set(
            Array.from(timeline.querySelectorAll('.update-item'))
                .map(item => item.dataset.updateId)
        );
        
        let newCount = 0;
        let updatedCount = 0;
        
        // Check for new updates or updates with changed content
        for (const update of data.updates) {
            if (!existingIds.has(update.id)) {
                const updateElement = createUpdateElement(update);
                timeline.insertBefore(updateElement, timeline.firstChild);
                newCount++;
            } else {
                // Update existing element (for reaction changes)
                const existingElement = timeline.querySelector(`[data-update-id="${update.id}"]`);
                if (existingElement) {
                    const newElement = createUpdateElement(update);
                    existingElement.replaceWith(newElement);
                    updatedCount++;
                }
            }
        }
        
        if (newCount > 0) {
            console.log(`[Updates] Added ${newCount} new update(s)`);
            showNotification(`${newCount} new update${newCount > 1 ? 's' : ''} added`);
        } else if (updatedCount > 0) {
            console.log(`[Updates] Updated ${updatedCount} update(s) (reactions/content changed)`);
        }
    } catch (error) {
        console.error('[Updates] Error refreshing updates:', error);
    }
}

// Setup load more button
function setupLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadUpdates(true);
        });
    }
}

// Update load more button visibility
function updateLoadMoreButton() {
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (loadMoreContainer) {
        if (hasMore) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.disabled = isLoading;
        loadMoreBtn.textContent = isLoading ? 'Loading...' : 'Load More Updates';
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 24px;
        background: rgba(220, 38, 38, 0.9);
        color: white;
        font-family: 'Oxanium', sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

function extractUserId(messageUrl) {
    // Extract user ID from Discord message URL (approximate - won't be perfect)
    // Since we're using author_avatar, we actually need the user ID from author
    // But we store the avatar hash, so we'll use a default embed avatar
    return '0';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS animations
if (!document.getElementById('updates-animations-style')) {
    const style = document.createElement('style');
    style.id = 'updates-animations-style';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

