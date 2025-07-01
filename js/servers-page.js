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
            port: 27052,
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
        if (playerPercentage >= 90) {
            playerCountClass = 'nearly-full';
            serverCapacityClass = 'nearly-full';
        } else if (playerPercentage >= 70) {
            playerCountClass = 'getting-full';
            serverCapacityClass = 'getting-full';
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'server-wrapper';
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
            <a href="${server.link}" class="server-join-btn" ${!isOnline ? 'style="pointer-events: none;"' : ''}>
                ${isOnline ? 'JOIN' : 'OFFLINE'}
            </a>
        `;
        
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
        if (playerPercentage >= 90) {
            playerCountClass = 'nearly-full';
            serverCapacityClass = 'nearly-full';
        } else if (playerPercentage >= 70) {
            playerCountClass = 'getting-full';
            serverCapacityClass = 'getting-full';
        }

        // Update server item classes
        const serverItem = wrapper.querySelector('.server-item');
        serverItem.className = `server-item ${serverCapacityClass}`;
        
        // Update player count and class
        const playersSpan = wrapper.querySelector('.server-players-display span');
        playersSpan.textContent = `${playerCount}/${maxPlayers}`;
        playersSpan.className = playerCountClass;
        
        // Update gamemode and map
        const gamemodeDisplay = wrapper.querySelector('.server-gamemode-display');
        gamemodeDisplay.innerHTML = `Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}`;
        
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
}); 