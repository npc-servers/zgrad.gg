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
    return `
        <a href="${server.link}" class="server-card">
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
                        ${status.players}/${status.maxPlayers}
                    </span>
                    <span class="server-map">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="map-icon">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                            <line x1="8" y1="2" x2="8" y2="18"></line>
                            <line x1="16" y1="6" x2="16" y2="22"></line>
                        </svg>
                        ${status.map}
                    </span>
                    <div class="server-status">
                        <div class="status-indicator ${status.online ? 'status-online' : 'status-offline'}"></div>
                        <span>${status.online ? 'Online' : 'Offline'}</span>
                    </div>
                    <div class="connect-button" title="Connect to server">
                        <span>Connect</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="connect-icon">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
        </a>
    `;
}

function updateServers() {
    const serversContainer = document.getElementById('serversContainer');
    if (!serversContainer) return;

    serversContainer.innerHTML = ''; // Clear existing content

    servers.forEach(server => {
        updateServerStatus(server).then(status => {
            const serverCard = createServerCard(server, status);
            serversContainer.innerHTML += serverCard;
        });
    });
}

// Update servers every 30 seconds
document.addEventListener('DOMContentLoaded', () => {
    updateServers();
    setInterval(updateServers, 30000);
}); 