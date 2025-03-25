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
            <h2 class="server-title">${server.title}</h2>
            <div class="server-gamemode">${server.gamemode}</div>
            <div class="server-info">
                <div class="server-status">
                    <div class="status-indicator ${status.online ? 'status-online' : 'status-offline'}"></div>
                    <span>${status.online ? 'Online' : 'Offline'}</span>
                </div>
                <div class="server-players">Players: ${status.players}/${status.maxPlayers}</div>
                <div class="server-map">Map: ${status.map}</div>
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