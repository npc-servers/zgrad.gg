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
            port: 27050,
            region: 'US',
            gamemode: 'Homicide Only',
            link: '/us4/connect.html'
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
        
        // Create different HTML based on server status
        if (isOnline) {
            wrapper.innerHTML = `
                <div class="server-item ${serverCapacityClass}" data-server-id="${server.id}">
                    <div class="server-content">
                        <div class="server-info">
                            <div class="server-name-display">${server.title}</div>
                            <div class="server-players-display">// <span class="${playerCountClass}">${playerCount}/${maxPlayers}</span> players online</div>
                            <div class="server-gamemode-display">Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}</div>
                        </div>
                    </div>
                </div>
                <a href="${server.link}" class="server-join-btn">JOIN</a>
            `;
        } else {
            wrapper.innerHTML = `
                <div class="server-item ${serverCapacityClass}" data-server-id="${server.id}">
                    <div class="server-content">
                        <div class="server-info">
                            <div class="server-name-display">${server.title}</div>
                            <div class="server-offline-message">This server is down, we may be experiencing an outage or crashed :(</div>
                        </div>
                    </div>
                </div>
                <a href="${server.link}" class="server-join-btn" style="pointer-events: none;">OFFLINE</a>
            `;
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
    
    // Hosting Notification Functionality
    const initHostingNotification = () => {
        const notification = document.getElementById('hostingNotification');
        const notificationHeader = document.getElementById('notificationHeader');
        
        if (!notification || !notificationHeader) return;
        
        // Check if user has already interacted with notification
        const hasSeenNotification = localStorage.getItem('hostingNotificationSeen');
        const lastDismissed = localStorage.getItem('hostingNotificationDismissed');
        
        // Don't show if dismissed within last 7 days
        if (lastDismissed) {
            const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }
        
        // Show notification immediately, let CSS handle the delay
        notification.classList.add('show');
        
        // Track that notification has been shown
        localStorage.setItem('hostingNotificationSeen', 'true');
        
        // Handle notification header click (expand/collapse)
        notificationHeader.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = notification.classList.contains('expanded');
            
            if (isExpanded) {
                notification.classList.remove('expanded');
            } else {
                notification.classList.add('expanded');
            }
            
            // Track user interaction
            localStorage.setItem('hostingNotificationInteracted', 'true');
        });
        
        // Handle affiliate button click tracking
        const affiliateBtn = notification.querySelector('.affiliate-btn');
        if (affiliateBtn) {
            affiliateBtn.addEventListener('click', (e) => {
                // Track affiliate button click
                localStorage.setItem('hostingNotificationClicked', 'true');
                
                // Optional: You can add analytics tracking here
                console.log('Affiliate button clicked - Physgun referral');
            });
        }
        
        // Handle copy code functionality
        const copyCodeElement = notification.querySelector('.copy-code');
        if (copyCodeElement) {
            copyCodeElement.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const codeText = copyCodeElement.getAttribute('data-code');
                
                try {
                    // Use modern clipboard API if available
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(codeText);
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = codeText;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        textArea.style.left = '-9999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                    
                    // Visual feedback
                    copyCodeElement.classList.add('copied');
                    const originalText = copyCodeElement.textContent;
                    copyCodeElement.textContent = 'COPIED!';
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        copyCodeElement.classList.remove('copied');
                        copyCodeElement.textContent = originalText;
                    }, 2000);
                    
                    // Track copy action
                    localStorage.setItem('hostingNotificationCodeCopied', 'true');
                    console.log('Discount code copied to clipboard:', codeText);
                    
                } catch (err) {
                    console.error('Failed to copy code:', err);
                    
                    // Fallback visual feedback for copy failure
                    copyCodeElement.style.background = 'rgba(244, 67, 54, 0.3)';
                    copyCodeElement.style.borderColor = 'rgba(244, 67, 54, 0.6)';
                    const originalText = copyCodeElement.textContent;
                    copyCodeElement.textContent = 'FAILED';
                    
                    setTimeout(() => {
                        copyCodeElement.style.background = '';
                        copyCodeElement.style.borderColor = '';
                        copyCodeElement.textContent = originalText;
                    }, 2000);
                }
            });
        }
        
        // Add close functionality (optional - click outside to dismiss)
        document.addEventListener('click', (e) => {
            if (notification.classList.contains('show') && 
                !notification.contains(e.target) && 
                notification.classList.contains('expanded')) {
                
                notification.classList.remove('expanded');
                
                // If user clicks outside after expanding, consider it as "dismissed"
                setTimeout(() => {
                    if (!notification.classList.contains('expanded')) {
                        localStorage.setItem('hostingNotificationDismissed', Date.now().toString());
                    }
                }, 300);
            }
        });
        
        // Auto-hide notification after 60 seconds if not interacted with
        setTimeout(() => {
            const hasInteracted = localStorage.getItem('hostingNotificationInteracted');
            if (!hasInteracted && notification.classList.contains('show')) {
                notification.classList.remove('show');
                localStorage.setItem('hostingNotificationDismissed', Date.now().toString());
            }
        }, 60000);
    };
    
    // Initialize notification system
    initHostingNotification();
}); 