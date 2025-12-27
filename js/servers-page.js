import { SERVER_GROUPS } from './serverConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    const serverList = document.getElementById('serverList');
    let serverElements = new Map(); // Track existing server elements
    
    const servers = SERVER_GROUPS;
    
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
    
    // Function to format server title with flag SVG
    const formatServerTitleWithFlag = (title, region) => {
        let flagSvg = '';
        if (region === 'US') {
            flagSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 36 36" style="display: inline-block; vertical-align: middle; margin-left: 4px;"><!-- Icon from Twitter Emoji by Twitter - https://creativecommons.org/licenses/by/4.0/ --><path fill="#B22334" d="M35.445 7C34.752 5.809 33.477 5 32 5H18v2h17.445zM0 25h36v2H0zm18-8h18v2H18zm0-4h18v2H18zM0 21h36v2H0zm4 10h28c1.477 0 2.752-.809 3.445-2H.555c.693 1.191 1.968 2 3.445 2zM18 9h18v2H18z"/><path fill="#EEE" d="M.068 27.679c.017.093.036.186.059.277c.026.101.058.198.092.296c.089.259.197.509.333.743L.555 29h34.89l.002-.004a4.22 4.22 0 0 0 .332-.741a3.75 3.75 0 0 0 .152-.576c.041-.22.069-.446.069-.679H0c0 .233.028.458.068.679zM0 23h36v2H0zm0-4v2h36v-2H18zm18-4h18v2H18zm0-4h18v2H18zM0 9zm.555-2l-.003.005L.555 7zM.128 8.044c.025-.102.06-.199.092-.297a3.78 3.78 0 0 0-.092.297zM18 9h18c0-.233-.028-.459-.069-.68a3.606 3.606 0 0 0-.153-.576A4.21 4.21 0 0 0 35.445 7H18v2z"/><path fill="#3C3B6E" d="M18 5H4a4 4 0 0 0-4 4v10h18V5z"/><path fill="#FFF" d="M2.001 7.726l.618.449l-.236.725L3 8.452l.618.448l-.236-.725L4 7.726h-.764L3 7l-.235.726zm2 2l.618.449l-.236.725l.617-.448l.618.448l-.236-.725L6 9.726h-.764L5 9l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L9 9l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L13 9l-.235.726zm-8 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L5 13l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L9 13l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L13 13l-.235.726zm-6-6l.618.449l-.236.725L7 8.452l.618.448l-.236-.725L8 7.726h-.764L7 7l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 7l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 7l-.235.726zm-12 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L3 11l-.235.726zM6.383 12.9L7 12.452l.618.448l-.236-.725l.618-.449h-.764L7 11l-.235.726h-.764l.618.449zm3.618-1.174l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 11l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 11l-.235.726zm-12 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L3 15l-.235.726zM6.383 16.9L7 16.452l.618.448l-.236-.725l.618-.449h-.764L7 15l-.235.726h-.764l.618.449zm3.618-1.174l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 15l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 15l-.235.726z"/></svg>';
        } else if (region === 'EU') {
            flagSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 36 36" style="display: inline-block; vertical-align: middle; margin-left: 4px;"><!-- Icon from Twitter Emoji by Twitter - https://creativecommons.org/licenses/by/4.0/ --><path fill="#039" d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4"/><path fill="#FC0" d="m18.539 9.705l.849-.617h-1.049l-.325-.998l-.324.998h-1.049l.849.617l-.325.998l.849-.617l.849.617zm0 17.333l.849-.617h-1.049l-.325-.998l-.324.998h-1.049l.849.617l-.325.998l.849-.617l.849.617zm-8.666-8.667l.849-.617h-1.05l-.324-.998l-.325.998H7.974l.849.617l-.324.998l.849-.617l.849.617zm1.107-4.285l.849-.617h-1.05l-.324-.998l-.324.998h-1.05l.849.617l-.324.998l.849-.617l.849.617zm0 8.619l.849-.617h-1.05l-.324-.998l-.324.998h-1.05l.849.617l-.324.998l.849-.617l.849.617zm3.226-11.839l.849-.617h-1.05l-.324-.998l-.324.998h-1.05l.849.617l-.324.998l.849-.617l.849.617zm0 15.067l.849-.617h-1.05l-.324-.998l-.324.998h-1.05l.849.617l-.324.998l.849-.616l.849.616zm11.921-7.562l-.849-.617h1.05l.324-.998l.325.998h1.049l-.849.617l.324.998l-.849-.617l-.849.617zm-1.107-4.285l-.849-.617h1.05l.324-.998l.324.998h1.05l-.849.617l.324.998l-.849-.617l-.849.617zm0 8.619l-.849-.617h1.05l.324-.998l.324.998h1.05l-.849.617l.324.998l-.849-.617l-.849.617zm-3.226-11.839l-.849-.617h1.05l.324-.998l.324.998h1.05l-.849.617l.324.998l-.849-.617l-.849.617zm0 15.067l-.849-.617h1.05l.324-.998l.324.998h1.05l-.849.617l.324.998l-.849-.616l-.849.616z"/></svg>';
        }
        // Append flag SVG after the region number (e.g., "ZGRAD US1 [US Flag SVG]")
        return title + (flagSvg ? ' ' + flagSvg : '');
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
        
        // Format server title with flag
        const serverTitleWithFlag = formatServerTitleWithFlag(server.title, server.region);
        
        // Create different HTML based on server status
        if (isOnline) {
            serverItem.innerHTML = `
                <div class="server-content">
                    <div class="server-info">
                        <div class="server-name-display">${serverTitleWithFlag}</div>
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
                        <div class="server-name-display">${serverTitleWithFlag}</div>
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
        
        // Format server title with flag
        const serverTitleWithFlag = formatServerTitleWithFlag(server.title, server.region);
        
        if (isOnline) {
            // Update for online server
            serverInfo.innerHTML = `
                <div class="server-name-display">${serverTitleWithFlag}</div>
                <div class="server-players-display">// <span class="${playerCountClass}">${playerCount}/${maxPlayers}</span> players online</div>
                <div class="server-gamemode-display">Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}</div>
            `;
        } else {
            // Update for offline server
            serverInfo.innerHTML = `
                <div class="server-name-display">${serverTitleWithFlag}</div>
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
        
        // Auto-open popup if URL has #guide hash
        if (window.location.hash === '#guide') {
            popup.classList.add('show');
            document.body.style.overflow = 'hidden';
            // Clear the hash without triggering a page reload
            history.replaceState(null, '', window.location.pathname);
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