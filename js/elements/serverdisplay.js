document.addEventListener('DOMContentLoaded', function() {
    const servers = [
        {
            id: 'zgrad1',
            ip: '193.243.190.18',
            port: 27066
        },
        {
            id: 'zgrad2',
            ip: '193.243.190.18',
            port: ''
        }
    ];

    const cards = document.querySelectorAll('.sd-server');

    cards.forEach(function(card) {
        var title = card.querySelector('.sd-server-name');
        var players = card.querySelector('.sd-player-count');
        var status = card.querySelector('.sd-status');
        var cannotConnect = card.querySelector('.sd-offline-message');
        var connectButton = card.querySelector('.sd-connect-btn');

        title.textContent = card.dataset.title;
        if (connectButton) {
            connectButton.href = card.dataset.link;
        }

        const server = servers.find(s => s.id === card.dataset.id);

        if (server) {
            fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(serverInfo => {
                    if (
                        (serverInfo && serverInfo.status && serverInfo.status.toLowerCase() === 'online') ||
                        (serverInfo && (serverInfo.players !== undefined || serverInfo.map))
                    ) {
                        status.classList.add('online');
                        status.classList.remove('offline');

                        const currentPlayers = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                        const maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || "Unknown";

                        players.textContent = `${currentPlayers}/${maxPlayers} players online`;
                        players.style.display = 'block';
                        
                        if (connectButton) {
                            connectButton.style.display = 'block';
                        }
                        cannotConnect.style.display = 'none';
                    } else {
                        handleOfflineState(status, players, connectButton, cannotConnect);
                    }
                })
                .catch(error => {
                    console.error(`Error fetching data for ${server.id}:`, error);
                    handleOfflineState(status, players, connectButton, cannotConnect);
                });
        }
    });

    function handleOfflineState(status, players, connectButton, cannotConnect) {
        status.classList.add('offline');
        status.classList.remove('online');
        players.style.display = 'none'; // Hide the player count completely when offline
        if (connectButton) {
            connectButton.style.display = 'none';
        }
        cannotConnect.style.display = 'block';
    }
});