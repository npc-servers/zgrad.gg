document.addEventListener('DOMContentLoaded', () => {
    // Get server ID from URL path
    const path = window.location.pathname;
    const serverMatch = path.match(/\/connect\/(us|eu)(\d+)(?:\.html)?/);
    
    if (!serverMatch) {
        console.error('Could not determine server from URL:', path);
        return;
    }
    
    const serverRegion = serverMatch[1].toLowerCase();
    const serverNumber = serverMatch[2];
    // US servers use zgrad1, zgrad2, etc. EU servers use zgradeu1, zgradeu2, etc.
    const serverId = serverRegion === 'us' 
        ? `zgrad${serverNumber}` 
        : `zgrad${serverRegion}${serverNumber}`;
    
    // Server configuration - same as servers-page.js
    const servers = {
        'zgrad1': {
            id: 'zgrad1',
            title: 'ZGRAD US1',
            suffix: 'US1',
            ip: '193.243.190.18',
            port: 27066,
            region: 'US',
            gamemode: 'All Gamemodes'
        },
        'zgrad2': {
            id: 'zgrad2',
            title: 'ZGRAD US2',
            suffix: 'US2',
            ip: '193.243.190.18',
            port: 27051,
            region: 'US',
            gamemode: 'All Gamemodes'
        },
        'zgrad3': {
            id: 'zgrad3',
            title: 'ZGRAD US3',
            suffix: 'US3',
            ip: '193.243.190.18',
            port: 27053,
            region: 'US',
            gamemode: 'TDM 24/7'
        },
        'zgrad4': {
            id: 'zgrad4',
            title: 'ZGRAD US4',
            suffix: 'US4',
            ip: '193.243.190.18',
            port: 27052,
            region: 'US',
            gamemode: 'Homicide Only'
        },
        'zgradeu1': {
            id: 'zgradeu1',
            title: 'ZGRAD EU1',
            suffix: 'EU1',
            ip: '23.161.169.60',
            port: 27015,
            region: 'EU',
            gamemode: 'All Gamemodes'
        }
    };
    
    const currentServer = servers[serverId];
    
    if (!currentServer) {
        console.error('Unknown server ID:', serverId);
        return;
    }
    
    // DOM elements
    const serverTitle = document.querySelector('.connect-server-title');
    const serverInfo = document.querySelector('.connect-server-info');
    
    // Set server title
    if (serverTitle) {
        const titleText = `ZGRAD ${currentServer.suffix}`;
        serverTitle.textContent = titleText;
        serverTitle.setAttribute('data-text', titleText);
    }
    
    // Function to fetch server status
    const fetchServerStatus = () => {
        return fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${currentServer.ip}&port=${currentServer.port}&type=info`)
            .then(response => response.json())
            .then(serverData => {
                const status = {
                    online: false,
                    players: 0,
                    maxPlayers: 0,
                    map: 'Unknown',
                    gamemode: currentServer.gamemode
                };

                if (serverData && (serverData.status?.toLowerCase() === 'online' || serverData.players !== undefined)) {
                    status.online = true;
                    status.players = serverData.players || serverData.num_players || serverData.playercount || 0;
                    status.maxPlayers = serverData.maxplayers || serverData.max_players || serverData.maxclients || 32;
                    status.map = serverData.map || 'Unknown';
                    
                    // Extract gamemode from server name if available
                    const serverName = serverData.name || serverData.hostname || '';
                    const gamemodeMatch = serverName.match(/Now Playing:\s*([^|]+)/i);
                    if (gamemodeMatch) {
                        status.gamemode = gamemodeMatch[1].trim();
                    }
                }

                return status;
            })
            .catch(error => {
                console.error(`Error fetching data for ${currentServer.id}:`, error);
                return { 
                    online: false, 
                    players: 0, 
                    maxPlayers: 32, 
                    map: 'Unknown',
                    gamemode: currentServer.gamemode
                };
            });
    };
    
    // Function to update server info display
    const updateServerInfo = (status) => {
        if (!serverInfo) return;
        
        if (status.online) {
            serverInfo.innerHTML = `<span class="players">${status.players}</span> players <span style="color: #a8a8a8;">playing</span> <span class="gamemode">${status.gamemode}</span> <span style="color: #a8a8a8;">on</span> <span class="map">${status.map}</span>`;
        } else {
            serverInfo.innerHTML = `<span class="loading">Server offline or unreachable</span>`;
        }
    };
    
    // Function to redirect to Steam
    const redirectToSteam = (status) => {
        if (status.online) {
            const steamUrl = `steam://connect/${currentServer.ip}:${currentServer.port}`;
            window.location.href = steamUrl;
        }
    };
    
    // Function to update all elements
    const updateServerData = () => {
        // Set loading state
        if (serverInfo) {
            serverInfo.innerHTML = '<span class="loading">Loading server information...</span>';
        }
        
        // Fetch server data
        fetchServerStatus()
            .then(status => {
                updateServerInfo(status);
                
                // Redirect to Steam after a brief delay to show the info
                setTimeout(() => {
                    redirectToSteam(status);
                }, 2000);
            })
            .catch(error => {
                console.error('Error updating server data:', error);
                
                // Set error state
                if (serverInfo) {
                    serverInfo.innerHTML = '<span class="loading">Error loading server information</span>';
                }
            });
    };
    
    // No button handling needed anymore
    
    // Initial load
    updateServerData();
}); 