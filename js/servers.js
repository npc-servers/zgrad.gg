// Server data
const servers = [
    {
        id: 'zgrad1',
        title: 'ZGRAD US1',
        ip: '193.243.190.18',
        port: 27066,
        region: 'US',
        gamemode: 'All Gamemodes',
        link: '/us1/connect.html'
    },
    {
        id: 'zgrad2',
        title: 'ZGRAD US2',
        ip: '193.243.190.18',
        port: 27051,
        region: 'US',
        gamemode: 'All Gamemodes',
        link: '/us2/connect.html'
    },
    {
        id: 'zgrad3',
        title: 'ZGRAD US3',
        ip: '193.243.190.18',
        port: 27053,
        region: 'US',
        gamemode: 'Low Loot Rate',
        link: '/us3/connect.html'
    },
    {
        id: 'zgrad4',
        title: 'ZGRAD US4',
        ip: '193.243.190.18',
        port: 27052,
        region: 'US',
        gamemode: 'Homicide Only',
        link: '/us4/connect.html'
    }
];

// Track current server statuses
let currentServerStatuses = {};

function updateServerStatus(server) {
    return fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`)
        .then(response => response.json())
        .then(serverInfo => {
            const status = {
                online: false,
                players: 0,
                maxPlayers: 0,
                map: 'Unknown'
            };

            if (serverInfo && (serverInfo.status?.toLowerCase() === 'online' || serverInfo.players !== undefined)) {
                status.online = true;
                status.players = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                status.maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || "?";
                status.map = serverInfo.map || 'Unknown';
            }

            return status;
        })
        .catch(error => {
            console.error(`Error fetching data for ${server.id}:`, error);
            return { online: false, players: 0, maxPlayers: 0, map: 'Unknown' };
        });
}

function createServerCard(server, status) {
    const serverCard = document.createElement('a');
    serverCard.href = status.online ? server.link : 'javascript:void(0)';
    serverCard.className = 'server-card';
    serverCard.id = `server-${server.id}`;
    serverCard.dataset.players = status.players;
    
    // Add offline class if server is offline
    if (!status.online) {
        serverCard.classList.add('server-offline');
    }
    
    if (status.online) {
        serverCard.innerHTML = `
            <div class="server-card-content">
                <h2 class="server-title">${server.title}</h2>
                <div class="server-info">
                    <div class="server-gamemode">${server.gamemode}</div>
                    <span class="server-players">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="player-icon">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span class="player-count">${status.players}/${status.maxPlayers}</span>
                    </span>
                    <span class="server-map">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="map-icon">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                        <span class="map-name">${status.map}</span>
                    </span>
                    <div class="server-status">
                        <div class="status-indicator status-online"></div>
                        <span>Online</span>
                    </div>
                    <div class="connect-button" title="Connect to server">
                        <span>Connect</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="connect-icon">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Simplified template for offline servers - now more compact
        serverCard.innerHTML = `
            <div class="server-card-content">
                <h2 class="server-title">${server.title}</h2>
                <div class="server-info">
                    <div class="server-offline-message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="15" x2="16" y2="15"></line>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                        <span>server offline</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    return serverCard;
}

function updateServerCard(serverCard, status) {
    serverCard.dataset.players = status.players;
    const wasOnline = !serverCard.classList.contains('server-offline');
    
    // Check if online status changed
    if (wasOnline !== status.online) {
        // Update server card with completely new content
        serverCard.href = status.online ? servers.find(s => s.id === serverCard.id.replace('server-', '')).link : 'javascript:void(0)';
        
        // Toggle offline class
        serverCard.classList.toggle('server-offline', !status.online);
        
        // Replace entire content
        if (status.online) {
            // Server came back online - recreate the full card content
            const server = servers.find(s => s.id === serverCard.id.replace('server-', ''));
            serverCard.innerHTML = `
                <div class="server-card-content">
                    <h2 class="server-title">${server.title}</h2>
                    <div class="server-info">
                        <div class="server-gamemode">${server.gamemode}</div>
                        <span class="server-players">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="player-icon">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span class="player-count">${status.players}/${status.maxPlayers}</span>
                        </span>
                        <span class="server-map">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="map-icon">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                <line x1="8" y1="2" x2="8" y2="18"></line>
                                <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                            <span class="map-name">${status.map}</span>
                        </span>
                        <div class="server-status">
                            <div class="status-indicator status-online"></div>
                            <span>Online</span>
                        </div>
                        <div class="connect-button" title="Connect to server">
                            <span>Connect</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="connect-icon">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
            `;
            // Add animation to whole card
            serverCard.classList.add('status-change-animation');
            setTimeout(() => {
                serverCard.classList.remove('status-change-animation');
            }, 1500);
        } else {
            // Server went offline - show compact offline message
            const server = servers.find(s => s.id === serverCard.id.replace('server-', ''));
            serverCard.innerHTML = `
                <div class="server-card-content">
                    <h2 class="server-title">${server.title}</h2>
                    <div class="server-info">
                        <div class="server-offline-message">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="8" y1="15" x2="16" y2="15"></line>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                            <span>server offline</span>
                        </div>
                    </div>
                </div>
            `;
            // Add animation to whole card
            serverCard.classList.add('status-change-animation');
            setTimeout(() => {
                serverCard.classList.remove('status-change-animation');
            }, 1500);
        }
    } else if (status.online) {
        // Server is still online, just update the values
        
        // Update player count
        const playerCountElement = serverCard.querySelector('.player-count');
        if (playerCountElement) {
            playerCountElement.textContent = `${status.players}/${status.maxPlayers}`;
            
            // Add animation for player count changes
            playerCountElement.classList.add('update-animation');
            setTimeout(() => {
                playerCountElement.classList.remove('update-animation');
            }, 1000);
        }
        
        // Update map name
        const mapNameElement = serverCard.querySelector('.map-name');
        if (mapNameElement && mapNameElement.textContent !== status.map) {
            mapNameElement.textContent = status.map;
            mapNameElement.classList.add('update-animation');
            setTimeout(() => {
                mapNameElement.classList.remove('update-animation');
            }, 1000);
        }
    }
    // If server is still offline, no need to update anything
}

function sortServersByPlayers(container) {
    const serverCards = Array.from(container.children);
    
    serverCards.sort((a, b) => {
        const aIsOffline = a.classList.contains('server-offline');
        const bIsOffline = b.classList.contains('server-offline');
        
        // If one is offline and one is online, the offline one goes last
        if (aIsOffline && !bIsOffline) return 1;
        if (!aIsOffline && bIsOffline) return -1;
        
        // If both have the same online status, sort by player count
        const aPlayers = parseInt(a.dataset.players) || 0;
        const bPlayers = parseInt(b.dataset.players) || 0;
        return bPlayers - aPlayers; // Sort by highest player count
    });
    
    // Check if order changed
    let orderChanged = false;
    for (let i = 0; i < serverCards.length; i++) {
        if (container.children[i] !== serverCards[i]) {
            orderChanged = true;
            break;
        }
    }
    
    // Only reorder if needed
    if (orderChanged) {
        // Save current positions for animation
        serverCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            card.dataset.oldTop = rect.top;
        });
        
        // Reorder elements
        serverCards.forEach(card => {
            container.appendChild(card);
        });
        
        // Apply animations
        setTimeout(() => {
            serverCards.forEach(card => {
                const oldTop = parseFloat(card.dataset.oldTop);
                const newTop = card.getBoundingClientRect().top;
                const deltaY = oldTop - newTop;
                
                if (Math.abs(deltaY) > 5) { // Only animate if position changed significantly
                    // Set initial position
                    card.style.transform = `translateY(${deltaY}px)`;
                    card.style.transition = 'none';
                    
                    // Force reflow
                    card.offsetHeight;
                    
                    // Animate to new position
                    card.style.transform = '';
                    card.style.transition = 'transform 0.5s ease-out';
                }
            });
        }, 0);
    }
}

async function updateServers() {
    const serversContainer = document.getElementById('serversContainer');
    if (!serversContainer) return;

    // First time initialization
    if (Object.keys(currentServerStatuses).length === 0) {
        // Add styles for animations
        if (!document.getElementById('server-animations-style')) {
            const style = document.createElement('style');
            style.id = 'server-animations-style';
            style.textContent = `
                .server-card { 
                    transition: transform 0.5s ease-out, background-color 0.3s ease; 
                }
                .update-animation {
                    animation: pulse 1s ease-out;
                }
                @keyframes pulse {
                    0% { color: inherit; }
                    50% { color: var(--accent-color, #31aac9); }
                    100% { color: inherit; }
                }
                .server-offline {
                    background: rgba(180, 50, 50, 0.15);
                    cursor: default;
                    pointer-events: none;
                }
                .server-offline .server-title {
                    color: #f8f8f8;
                }
                .server-offline-message {
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 0.5rem;
                    padding: 0.35rem 0.75rem;
                    background-color: rgba(180, 50, 50, 0.2);
                    border-radius: 4px;
                    color: #f8f8f8;
                    white-space: nowrap;
                    width: auto;
                }
                .status-change-animation {
                    animation: flash 1.5s ease-out;
                }
                @keyframes flash {
                    0% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                /* Onload animation styles */
                .onload-animation {
                    opacity: 0;
                    transform: translateY(20px);
                    animation: fadeInUp 0.6s forwards;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                /* Shimmer effect for loading */
                .shimmer {
                    position: relative;
                    overflow: hidden;
                    background: rgba(40, 40, 40, 0.2);
                }
                .shimmer::after {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.08) 20%,
                        rgba(255, 255, 255, 0.1) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                    content: '';
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
                /* Media queries */
                @media (max-width: 768px) {
                    .server-offline-message {
                        font-size: 0.9rem;
                        padding: 0.3rem 0.6rem;
                    }
                }
                @media (max-width: 576px) {
                    .server-offline-message {
                        font-size: 0.8rem;
                        padding: 0.25rem 0.5rem;
                    }
                    .server-offline-message svg {
                        width: 14px;
                        height: 14px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Show loading state
        serversContainer.innerHTML = '';
        for (let i = 0; i < servers.length; i++) {
            const loadingCard = document.createElement('div');
            loadingCard.className = 'server-card shimmer';
            loadingCard.innerHTML = `
                <div class="server-card-content">
                    <div style="height: 30px; width: 120px; border-radius: 4px;"></div>
                </div>
            `;
            serversContainer.appendChild(loadingCard);
        }
        
        // Create initial cards for all servers
        const promises = servers.map(async server => {
            const status = await updateServerStatus(server);
            currentServerStatuses[server.id] = status;
            return { server, status };
        });
        
        const results = await Promise.all(promises);
        
        // Clear container and add all server cards
        serversContainer.innerHTML = '';
        
        // Add each server card with staggered animation delay
        results.forEach(({ server, status }, index) => {
            const serverCard = createServerCard(server, status);
            serverCard.classList.add('onload-animation');
            serverCard.style.animationDelay = `${index * 0.1}s`;
            serversContainer.appendChild(serverCard);
        });
        
        // Sort by player count
        sortServersByPlayers(serversContainer);
    } else {
        // Update existing cards
        const promises = servers.map(async server => {
            const status = await updateServerStatus(server);
            const oldStatus = currentServerStatuses[server.id] || { players: 0, map: '', online: false };
            currentServerStatuses[server.id] = status;
            
            const serverCard = document.getElementById(`server-${server.id}`);
            if (serverCard) {
                updateServerCard(serverCard, status);
            } else {
                const newCard = createServerCard(server, status);
                newCard.classList.add('onload-animation');
                serversContainer.appendChild(newCard);
            }
            
            return status;
        });
        
        await Promise.all(promises);
        
        // Sort by updated player counts
        sortServersByPlayers(serversContainer);
    }
}

// Update servers every 30 seconds
document.addEventListener('DOMContentLoaded', () => {
    // Animate the page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        // Add styles for title animation if not already present
        if (!document.getElementById('title-animation-style')) {
            const titleStyle = document.createElement('style');
            titleStyle.id = 'title-animation-style';
            titleStyle.textContent = `
                @keyframes titleFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .title-animation {
                    animation: titleFadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `;
            document.head.appendChild(titleStyle);
        }
        
        // Initial state
        pageTitle.style.opacity = '0';
        
        // Apply animation with a slight delay to make it appear after loading starts
        setTimeout(() => {
            pageTitle.classList.add('title-animation');
            pageTitle.style.opacity = '';  // Remove inline opacity
        }, 100);
    }
    
    // Initialize "How do I join?" modal
    const joinHelpBtn = document.getElementById('joinHelpBtn');
    const joinModal = document.getElementById('joinModal');
    const closeModals = document.querySelectorAll('.close-modal');
    
    function openModal(modal) {
        modal.classList.add('show');
        
        // Animate each step with a staggered delay
        const steps = modal.querySelectorAll('.join-step');
        steps.forEach((step, index) => {
            step.style.animationDelay = `${0.1 + (index * 0.1)}s`;
        });
        
        // Prevent scrolling on the body
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    if (joinHelpBtn && joinModal) {
        // Open join modal when button is clicked
        joinHelpBtn.addEventListener('click', () => openModal(joinModal));
    }
    
    // Close modals when close button is clicked
    closeModals.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.join-modal');
            if (modal) closeModal(modal);
        });
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('join-modal')) {
            closeModal(e.target);
        }
    });
    
    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.join-modal.show');
            if (openModal) closeModal(openModal);
        }
    });
    
    updateServers();
    setInterval(updateServers, 30000);
});

// Initialize help buttons animation
document.addEventListener('DOMContentLoaded', function() {
    const helpButtons = document.querySelector('.join-help-container');
    if (helpButtons) {
        // Reset animation if needed
        helpButtons.style.animation = 'none';
        helpButtons.offsetHeight; // Trigger reflow
        helpButtons.style.animation = null;
    }
}); 