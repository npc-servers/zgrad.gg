document.addEventListener('DOMContentLoaded', function() {
    const servers = [
        {
            id: 'zgrad1',
            title: 'ZGRAD US1',
            ip: '193.243.190.18',
            port: 27066,
            region: 'US',
            description: 'All Gamemodes',
            link: '/us1/connect.html'
        },
        {
            id: 'zgrad2',
            title: 'ZGRAD US2',
            ip: '193.243.190.18',
            port: 27067,
            region: 'US',
            description: 'TDM',
            link: '/us2/connect.html'
        }
    ];

    let currentTotalPlayers = 0;

    // Function to animate number counting
    function animateCount(el, start, end, duration) {
        // For the initial update, just set the value instantly
        if (start === 0 && !el.dataset.initialUpdate) {
            el.textContent = end;
            el.dataset.initialUpdate = 'true';
            return;
        }

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            el.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Function to update server status
    function updateServerStatus(server) {
        return fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`)
            .then(response => response.json())
            .then(serverInfo => {
                const status = {
                    online: false,
                    players: 0,
                    maxPlayers: 0
                };

                if (serverInfo && (serverInfo.status?.toLowerCase() === 'online' || serverInfo.players !== undefined)) {
                    status.online = true;
                    status.players = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                    status.maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || "?";
                }

                return status;
            })
            .catch(error => {
                console.error(`Error fetching data for ${server.id}:`, error);
                return { online: false, players: 0, maxPlayers: 0 };
            });
    }

    // Function to update total players display
    function updateTotalPlayersDisplay(newTotal) {
        const totalPlayersElement = document.getElementById('totalPlayers');
        if (totalPlayersElement) {
            const currentValue = parseInt(totalPlayersElement.textContent) || 0;
            if (currentValue !== newTotal) {
                animateCount(totalPlayersElement, currentValue, newTotal, 1000);
            }
        }
    }

    // Function to get total players from all servers
    async function updateTotalPlayers() {
        const statuses = await Promise.all(servers.map(server => updateServerStatus(server)));
        const newTotal = statuses.reduce((total, status) => {
            return total + (status.online ? status.players : 0);
        }, 0);
        currentTotalPlayers = newTotal;
        updateTotalPlayersDisplay(newTotal);
        return statuses;
    }

    // Handle servers page
    const serverList = document.querySelector('.sd-server-list');
    if (serverList) {
        servers.forEach(server => {
            const serverElement = document.createElement('div');
            serverElement.className = 'sd-server';
            serverElement.dataset.id = server.id;
            serverElement.innerHTML = `
                <img src="/assets/icons/${server.region.toLowerCase()}-flag.png" alt="${server.region}" class="sd-flag">
                <div class="sd-info">
                    <div class="sd-server-name">${server.title}</div>
                    <div class="sd-player-count"></div>
                    <div class="sd-offline-message">Cannot connect to server</div>
                </div>
                <a href="${server.link}" class="sd-connect-btn">Connect</a>
                <div class="sd-status"></div>
            `;
            serverList.appendChild(serverElement);

            updateServerStatus(server).then(status => {
                updateServerCard(serverElement, status);
            });
        });
    }

    // Handle index page server display
    const indexServersList = document.querySelector('.indesc-servers-list');
    if (indexServersList) {
        const container = indexServersList.parentElement;
        
        updateTotalPlayers().then(results => {
            // Filter out offline servers and servers below 50% capacity
            const popularServers = results.map((status, index) => ({
                server: servers[index],
                status
            })).filter(result => {
                if (!result.status.online) return false;
                if (result.status.maxPlayers === "?" || result.status.maxPlayers === 0) return false;
                const capacity = (result.status.players / result.status.maxPlayers) * 100;
                return capacity >= 50;
            }).sort((a, b) => b.status.players - a.status.players);

            // Display up to 3 popular servers
            indexServersList.innerHTML = ''; // Clear existing content
            popularServers.slice(0, 3).forEach(({ server, status }) => {
                const serverElement = createIndexServerElement(server, status);
                indexServersList.appendChild(serverElement);
            });

            // If no popular servers, show a message
            if (popularServers.length === 0) {
                indexServersList.innerHTML = '<div class="indesc-no-servers">No popular servers currently available</div>';
            }

            // Add footer with View Servers button
            if (!container.querySelector('.indesc-servers-footer')) {
                const footer = document.createElement('div');
                footer.className = 'indesc-servers-footer';
                footer.innerHTML = `
                    <a href="/servers.html" class="indesc-view-servers">View All Servers</a>
                `;
                container.appendChild(footer);
            }
        });
    }

    function createIndexServerElement(server, status) {
        const serverElement = document.createElement('div');
        serverElement.className = 'indesc-server';
        serverElement.innerHTML = `
            <img src="/assets/icons/${server.region.toLowerCase()}-flag.png" alt="${server.region}" class="indesc-server-flag">
            <div class="indesc-server-info">
                <div class="indesc-server-name">${server.title}</div>
                <div class="indesc-server-players">${status.players}/${status.maxPlayers} players</div>
            </div>
            <a href="${server.link}" class="indesc-server-connect">Connect</a>
            <div class="indesc-server-status online"></div>
        `;
        
        return serverElement;
    }

    function updateServerCard(card, status) {
        const playersElement = card.querySelector('.sd-player-count');
        const statusElement = card.querySelector('.sd-status');
        const offlineMessage = card.querySelector('.sd-offline-message');
        const connectButton = card.querySelector('.sd-connect-btn');

        if (status.online) {
            statusElement.classList.add('online');
            statusElement.classList.remove('offline');
            playersElement.textContent = `${status.players}/${status.maxPlayers} players online`;
            playersElement.style.display = 'block';
            connectButton.style.display = 'block';
            offlineMessage.style.display = 'none';
        } else {
            statusElement.classList.add('offline');
            statusElement.classList.remove('online');
            playersElement.style.display = 'none';
            connectButton.style.display = 'none';
            offlineMessage.style.display = 'block';
        }
    }

    // Update server status every 30 seconds
    setInterval(() => {
        if (serverList) {
            updateTotalPlayers().then(statuses => {
                servers.forEach((server, index) => {
                    const serverElement = document.querySelector(`.sd-server[data-id="${server.id}"]`);
                    if (serverElement) {
                        updateServerCard(serverElement, statuses[index]);
                    }
                });
            });
        }

        if (indexServersList) {
            updateTotalPlayers().then(results => {
                const popularServers = results.map((status, index) => ({
                    server: servers[index],
                    status
                })).filter(result => {
                    if (!result.status.online) return false;
                    if (result.status.maxPlayers === "?" || result.status.maxPlayers === 0) return false;
                    const capacity = (result.status.players / result.status.maxPlayers) * 100;
                    return capacity >= 50;
                }).sort((a, b) => b.status.players - a.status.players);

                indexServersList.innerHTML = '';
                popularServers.slice(0, 3).forEach(({ server, status }) => {
                    const serverElement = createIndexServerElement(server, status);
                    indexServersList.appendChild(serverElement);
                });

                if (popularServers.length === 0) {
                    indexServersList.innerHTML = '<div class="indesc-no-servers">No popular servers currently available</div>';
                }
            });
        }
    }, 30000);
});