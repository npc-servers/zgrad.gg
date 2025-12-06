document.addEventListener('DOMContentLoaded', () => {
    const serverList = document.getElementById('serverList');
    let serverElements = new Map(); // Track existing server elements
    
    // Server configuration - same as landing-section.js
    const servers = [
        {
            id: 'zgrad1',
            title: 'ZGRAD US1',
            ip: '193.243.190.18',
            port: 27066,
            region: 'US',
            gamemode: 'All Gamemodes',
            link: 'connect/us1',
            backgroundImage: '/images/loadingscreen/homigrad-essence.jpg'
        },
        {
            id: 'zgrad2',
            title: 'ZGRAD US2',
            ip: '193.243.190.18',
            port: 27051,
            region: 'US',
            gamemode: 'All Gamemodes',
            link: 'connect/us2',
            backgroundImage: '/images/loadingscreen/eighteenth.jpg'
        },
        {
            id: 'zgrad3',
            title: 'ZGRAD US3',
            ip: '193.243.190.18',
            port: 27053,
            region: 'US',
            gamemode: 'TDM 24/7',
            link: 'connect/us3',
            backgroundImage: '/images/loadingscreen/street-war.jpg'
        },
        {
            id: 'zgrad4',
            title: 'ZGRAD US4',
            ip: '193.243.190.18',
            port: 27052,
            region: 'US',
            gamemode: 'Homicide Only',
            link: 'connect/us4',
            backgroundImage: '/images/loadingscreen/eigth.jpg'
        }
    ];
    
    // Function to fetch server status
    const fetchServerStatus = (server) => {
        return fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`)
            .then(response => response.json())
            .then(serverInfo => {
                const status = {
                    online: false,
                    players: 0,
                    maxPlayers: 0,
                    map: 'Unknown',
                    gamemode: server.gamemode,
                    server: server
                };

                if (serverInfo && (serverInfo.status?.toLowerCase() === 'online' || serverInfo.players !== undefined)) {
                    status.online = true;
                    status.players = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                    status.maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || 32;
                    status.map = serverInfo.map || 'Unknown';
                    
                    // Extract gamemode from server name if available
                    const serverTitle = serverInfo.name || serverInfo.hostname || '';
                    const gamemodeMatch = serverTitle.match(/Now Playing:\s*([^|]+)/i);
                    if (gamemodeMatch) {
                        status.gamemode = gamemodeMatch[1].trim();
                    }
                }

                return status;
            })
            .catch(error => {
                console.error(`Error fetching data for ${server.id}:`, error);
                return { 
                    online: false, 
                    players: 0, 
                    maxPlayers: 32, 
                    map: 'Unknown',
                    gamemode: server.gamemode,
                    server: server 
                };
            });
    };
    
    // Function to create server item HTML
    const createServerItem = (serverStatus) => {
        const server = serverStatus.server;
        const isOnline = serverStatus.online;
        const playerCount = serverStatus.players;
        const maxPlayers = serverStatus.maxPlayers;
        const playerPercentage = maxPlayers > 0 ? (playerCount / maxPlayers) * 100 : 0;
        
        // Determine player count color classes and server capacity classes
        let playerCountClass = '';
        let serverCapacityClass = '';
        if (isOnline) {
            if (playerPercentage >= 90) {
                playerCountClass = 'nearly-full';
                serverCapacityClass = 'nearly-full';
            } else if (playerPercentage >= 70) {
                playerCountClass = 'getting-full';
                serverCapacityClass = 'getting-full';
            }
        } else {
            serverCapacityClass = 'offline';
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'server-wrapper';
        
        // Create server item element
        const serverItem = document.createElement('div');
        serverItem.className = `server-item ${serverCapacityClass}`;
        serverItem.setAttribute('data-server-id', server.id);
        
        // Set background image using CSS custom property
        serverItem.style.setProperty('--server-bg-image', `url('${server.backgroundImage}')`);
        
        // Create different HTML based on server status
        if (isOnline) {
            serverItem.innerHTML = `
                <div class="server-content">
                    <div class="server-info">
                        <div class="server-name-display">${server.title}</div>
                        <div class="server-players-display">// <span class="${playerCountClass}">${playerCount}/${maxPlayers}</span> players online</div>
                        <div class="server-gamemode-display">Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}</div>
                    </div>
                </div>
            `;
            
            const joinBtn = document.createElement('a');
            joinBtn.href = server.link;
            joinBtn.className = 'server-join-btn';
            joinBtn.textContent = 'JOIN';
            
            wrapper.appendChild(serverItem);
            wrapper.appendChild(joinBtn);
        } else {
            serverItem.innerHTML = `
                <div class="server-content">
                    <div class="server-info">
                        <div class="server-name-display">${server.title}</div>
                        <div class="server-offline-message">This server is down, we may be experiencing an outage or crashed :(</div>
                    </div>
                </div>
            `;
            
            const joinBtn = document.createElement('a');
            joinBtn.href = server.link;
            joinBtn.className = 'server-join-btn';
            joinBtn.textContent = 'OFFLINE';
            joinBtn.style.pointerEvents = 'none';
            
            wrapper.appendChild(serverItem);
            wrapper.appendChild(joinBtn);
        }
        
        return wrapper;
    };

    // Function to update individual server element
    const updateServerElement = (wrapper, serverStatus) => {
        const server = serverStatus.server;
        const isOnline = serverStatus.online;
        const playerCount = serverStatus.players;
        const maxPlayers = serverStatus.maxPlayers;
        const playerPercentage = maxPlayers > 0 ? (playerCount / maxPlayers) * 100 : 0;
        
        // Determine player count color classes and server capacity classes
        let playerCountClass = '';
        let serverCapacityClass = '';
        if (isOnline) {
            if (playerPercentage >= 90) {
                playerCountClass = 'nearly-full';
                serverCapacityClass = 'nearly-full';
            } else if (playerPercentage >= 70) {
                playerCountClass = 'getting-full';
                serverCapacityClass = 'getting-full';
            }
        } else {
            serverCapacityClass = 'offline';
        }

        // Update server item classes
        const serverItem = wrapper.querySelector('.server-item');
        serverItem.className = `server-item ${serverCapacityClass}`;
        
        // Update background image if not already set
        if (!serverItem.style.getPropertyValue('--server-bg-image')) {
            serverItem.style.setProperty('--server-bg-image', `url('${server.backgroundImage}')`);
        }
        
        // Update server info based on status
        const serverInfo = wrapper.querySelector('.server-info');
        
        if (isOnline) {
            // Update for online server
            serverInfo.innerHTML = `
                <div class="server-name-display">${server.title}</div>
                <div class="server-players-display">// <span class="${playerCountClass}">${playerCount}/${maxPlayers}</span> players online</div>
                <div class="server-gamemode-display">Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}</div>
            `;
        } else {
            // Update for offline server
            serverInfo.innerHTML = `
                <div class="server-name-display">${server.title}</div>
                <div class="server-offline-message">This server is down, we may be experiencing an outage or crashed :(</div>
            `;
        }
        
        // Update join button
        const joinBtn = wrapper.querySelector('.server-join-btn');
        joinBtn.textContent = isOnline ? 'JOIN' : 'OFFLINE';
        if (!isOnline) {
            joinBtn.style.pointerEvents = 'none';
        } else {
            joinBtn.style.pointerEvents = '';
        }
    };
    
    // Function to update server list
    const updateServerList = () => {
        // If no servers exist yet, show loading
        if (serverElements.size === 0) {
            serverList.innerHTML = '<div class="server-loading">Loading servers...</div>';
        }
        
        // Fetch status for all servers
        Promise.all(servers.map(server => fetchServerStatus(server)))
            .then(statuses => {
                // Calculate total player count
                const totalPlayers = statuses.reduce((sum, status) => sum + status.players, 0);
                const totalMaxPlayers = statuses.reduce((sum, status) => sum + status.maxPlayers, 0);
                const onlineServers = statuses.filter(status => status.online).length;
                
                // Update total playercount display
                const totalPlayercountText = document.querySelector('.total-playercount-text');
                if (totalPlayercountText) {
                    totalPlayercountText.className = 'total-playercount-text online';
                    totalPlayercountText.innerHTML = `<span class="current-count">${totalPlayers}</span>/${totalMaxPlayers} total players online across ${onlineServers} servers`;
                }
                
                // Sort servers by player count (highest first)
                statuses.sort((a, b) => {
                    // Online servers first
                    if (a.online && !b.online) return -1;
                    if (!a.online && b.online) return 1;
                    // Then by player count
                    return b.players - a.players;
                });
                
                // Clear loading message only on first load
                if (serverElements.size === 0) {
                    serverList.innerHTML = '';
                }
                
                // Update or create server elements
                statuses.forEach((serverStatus, index) => {
                    const serverId = serverStatus.server.id;
                    let wrapper = serverElements.get(serverId);
                    
                    if (!wrapper) {
                        // Create new server element
                        wrapper = createServerItem(serverStatus);
                        serverElements.set(serverId, wrapper);
                        serverList.appendChild(wrapper);
                    } else {
                        // Update existing server element
                        updateServerElement(wrapper, serverStatus);
                    }
                    
                    // Ensure correct order
                    const currentIndex = Array.from(serverList.children).indexOf(wrapper);
                    if (currentIndex !== index) {
                        if (index === 0) {
                            serverList.insertBefore(wrapper, serverList.firstChild);
                        } else {
                            const beforeElement = serverList.children[index];
                            if (beforeElement) {
                                serverList.insertBefore(wrapper, beforeElement);
                            } else {
                                serverList.appendChild(wrapper);
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error("Error updating server list:", error);
                
                // Update total playercount display with error state
                const totalPlayercountText = document.querySelector('.total-playercount-text');
                if (totalPlayercountText) {
                    totalPlayercountText.className = 'total-playercount-text offline';
                    totalPlayercountText.textContent = 'Error loading player count';
                }
                
                if (serverElements.size === 0) {
                    serverList.innerHTML = `
                        <div class="server-loading" style="color: #f44336;">
                            Error loading servers. Please try again later.
                        </div>
                    `;
                }
            });
    };
    
    // Update server list immediately and then every 30 seconds
    updateServerList();
    setInterval(updateServerList, 30000);
    
    
    // Join Guide Popup Functionality
    const initJoinGuidePopup = () => {
        const guideBtn = document.querySelector('.guide-btn');
        const popup = document.getElementById('joinGuidePopup');
        const popupClose = document.getElementById('popupClose');
        const popupBackdrop = document.getElementById('popupBackdrop');
        
        if (!guideBtn || !popup || !popupClose || !popupBackdrop) return;
        
        // Open popup when guide button is clicked
        guideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Track popup opened
            localStorage.setItem('joinGuidePopupOpened', 'true');
        });
        
        // Close popup when close button is clicked
        popupClose.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.remove('show');
            document.body.style.overflow = ''; // Restore background scrolling
            
            // Track popup closed
            localStorage.setItem('joinGuidePopupClosed', 'true');
        });
        
        // Close popup when backdrop is clicked
        popupBackdrop.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.remove('show');
            document.body.style.overflow = ''; // Restore background scrolling
            
            // Track popup closed via backdrop
            localStorage.setItem('joinGuidePopupClosedViaBackdrop', 'true');
        });
        
        // Close popup when Escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup.classList.contains('show')) {
                popup.classList.remove('show');
                document.body.style.overflow = ''; // Restore background scrolling
                
                // Track popup closed via escape key
                localStorage.setItem('joinGuidePopupClosedViaEscape', 'true');
            }
        });
        
        // Prevent popup content clicks from closing the popup
        const popupContent = popup.querySelector('.popup-content');
        if (popupContent) {
            popupContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    };
    
    // Initialize join guide popup system
    initJoinGuidePopup();
    
    // Initialize bloodsplatter animation using unified system
    initBloodsplatterAnimation();
});

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Bloodsplatter Animation System for Servers Page - Now using unified system
function initBloodsplatterAnimation() {
    // Check if the unified bloodsplatter system is available
    if (typeof window.BloodsplatterAnimations !== 'undefined') {
        // Add server-title-splatter configuration to unified system if it doesn't exist
        const customConfig = {
            centerX: 5, // Far left edge
            centerY: 15, // Upper edge
            duration: 0.6,
            delay: 0.2,
            ease: "power3.out"
        };
        
        // Add configuration if it doesn't exist
        window.BloodsplatterAnimations.addSplatterConfig('server-title-splatter', customConfig, 15.34);
        
        // Initialize using unified system
        window.BloodsplatterAnimations.initBloodsplatterAnimations(['.server-title-splatter'], {
            triggerStart: "top 95%",
            triggerActions: "play none none none"
        });
        
        // Also trigger immediately on page load (for users already at top) - custom logic for servers page
        const serverTitleSplatter = document.querySelector('.server-title-splatter');
        if (serverTitleSplatter) {
            gsap.delayedCall(0.7, () => { // Delay slightly longer than the config delay
                if (!serverTitleSplatter.classList.contains('bloodsplatter-revealed')) {
                    // Find the timeline and play it
                    const tl = window.BloodsplatterAnimations.createBloodsplatterAnimation(serverTitleSplatter, 'server-title-splatter');
                    if (tl) {
                        tl.play();
                        serverTitleSplatter.classList.add('bloodsplatter-revealed');
                    }
                }
            });
        }
    } else {
        console.error('BloodsplatterAnimations not loaded! Make sure bloodsplatter-animations.js is included.');
    }
}

// =============================================================================
// BLOODSPLATTER SYSTEM REMOVED - NOW USING UNIFIED SYSTEM
// =============================================================================
// All bloodsplatter-related functions have been moved to bloodsplatter-animations.js
// The servers page now uses the unified system for ZERO real-time calculations.