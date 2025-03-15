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
            port: 27054,
            region: 'US',
            description: 'Homicide only',
            link: '/us2/connect.html'
        },
        {
            id: 'zgrad3',
            title: 'ZGRAD US3',
            ip: '193.243.190.18',
            port: 27053,
            region: 'US',
            description: 'Low loot',
            link: '/us3/connect.html'
        },
        {
            id: 'hh1',
            title: 'Harrisons Homigrad US1',
            ip: '193.243.190.18',
            port: 27051,
            region: 'US',
            description: 'All Gamemodes',
            link: '/hh1/connect.html'
        },
        {
            id: 'hh2',
            title: 'Harrisons Homigrad US2',
            ip: '193.243.190.18',
            port: 27052,
            region: 'US',
            description: 'All Gamemodes',
            link: '/hh2/connect.html'
        },
        {
            id: 'hh3',
            title: 'Harrisons Homigrad US3',
            ip: '193.243.190.18',
            port: 27053,
            region: 'US',
            description: 'Homicide Only',
            link: '/hh3/connect.html'
        },
    ];


    let hasInitializedCount = false;

    // Animation helper functions
    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    function animateCount(el, start, end, duration) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easeOutExpo(progress);
            const currentValue = Math.floor(start + (end - start) * easedProgress);
            
            el.textContent = currentValue;
            el.classList.add('counting');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.classList.remove('counting');
            }
        }
        
        requestAnimationFrame(update);
    }

    // Update total servers count
    function updateTotalServers(animate = false) {
        const totalServersElement = document.getElementById('totalServers');
        if (totalServersElement) {
            const serverCount = servers.length;
            if (animate) {
                animateCount(totalServersElement, 0, serverCount, 2000);
            } else {
                totalServersElement.textContent = serverCount;
            }
        }
    }

    // Server status functions
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

    async function updateTotalPlayers(animate = false) {
        const statuses = await Promise.all(servers.map(server => updateServerStatus(server)));
        const newTotal = statuses.reduce((total, status) => {
            return total + (status.online ? status.players : 0);
        }, 0);
        
        const totalPlayersElement = document.getElementById('totalPlayers');
        const labelElement = totalPlayersElement?.parentElement?.querySelector('.indesc-stat-label');
        
        if (totalPlayersElement) {
            if (newTotal === 0) {
                totalPlayersElement.textContent = ":( no players online";
                totalPlayersElement.classList.remove('counting');
                if (labelElement) {
                    labelElement.style.display = 'none';
                }
            } else {
                if (labelElement) {
                    labelElement.style.display = '';
                }
                if (animate) {
                    animateCount(totalPlayersElement, 0, newTotal, 2000);
                } else {
                    totalPlayersElement.textContent = newTotal;
                }
            }
        }
        
        return statuses;
    }

    function getPopularServers(results) {
        return results.map((status, index) => ({
            server: servers[index],
            status
        })).filter(result => {
            if (!result.status.online) return false;
            if (result.status.maxPlayers === "?" || result.status.maxPlayers === 0) return false;
            const capacity = (result.status.players / result.status.maxPlayers) * 100;
            return capacity >= 50;
        }).sort((a, b) => b.status.players - a.status.players);
    }

    function getActiveServers(results, excludeServers = []) {
        return results.map((status, index) => ({
            server: servers[index],
            status
        })).filter(result => {
            if (excludeServers.some(excluded => excluded.server.id === result.server.id)) {
                return false;
            }
            return result.status.online && result.status.players > 0;
        }).sort((a, b) => b.status.players - a.status.players);
    }

    // Server UI creation functions
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
            <div class="indesc-server-status ${status.online ? 'online' : 'offline'}"></div>
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

    // Set up Indesc section animations
    const descSection = document.querySelector('.indesc-description-section');
    if (descSection) {
        const text = descSection.querySelector('.indesc-description-text');
        const serversContainer = descSection.querySelector('.indesc-servers-container');
        
        if (text) {
            text.style.opacity = '0';
            text.style.transform = 'translateY(40px)';
            text.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        }
        
        if (serversContainer) {
            serversContainer.style.opacity = '0';
            serversContainer.style.transform = 'translateY(40px)';
            serversContainer.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        }

        // Set initial counts without animation
        updateTotalPlayers(false);
        updateTotalServers(false);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (text) {
                        requestAnimationFrame(() => {
                            text.style.opacity = '1';
                            text.style.transform = 'translateY(0)';
                        });
                    }
                    
                    if (serversContainer) {
                        setTimeout(() => {
                            requestAnimationFrame(() => {
                                serversContainer.style.opacity = '1';
                                serversContainer.style.transform = 'translateY(0)';
                            });
                        }, 200);
                    }

                    if (!hasInitializedCount) {
                        updateTotalPlayers(true);
                        updateTotalServers(true);
                        hasInitializedCount = true;
                    }
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: "0px"
        });

        observer.observe(descSection);
    }

    // Initialize servers list with sorting
    const serverList = document.querySelector('.sd-server-list');
    if (serverList) {
        // First fetch all server statuses
        Promise.all(servers.map(server => updateServerStatus(server)))
            .then(statuses => {
                // Create array of servers with their status
                const serverStatusPairs = servers.map((server, index) => ({
                    server,
                    status: statuses[index]
                }));

                // Sort by online status and player count
                serverStatusPairs.sort((a, b) => {
                    if (a.status.online && !b.status.online) return -1;
                    if (!a.status.online && b.status.online) return 1;
                    return b.status.players - a.status.players;
                });

                // Clear and populate server list
                serverList.innerHTML = '';
                serverStatusPairs.forEach(({ server, status }) => {
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
                    updateServerCard(serverElement, status);
                });
            });

        // Update and resort servers periodically
        setInterval(() => {
            Promise.all(servers.map(server => updateServerStatus(server)))
                .then(statuses => {
                    const serverStatusPairs = servers.map((server, index) => ({
                        server,
                        status: statuses[index]
                    }));

                    // Sort by online status and player count
                    serverStatusPairs.sort((a, b) => {
                        if (a.status.online && !b.status.online) return -1;
                        if (!a.status.online && b.status.online) return 1;
                        return b.status.players - a.status.players;
                    });

                    // Update server positions and status
                    serverStatusPairs.forEach(({ server, status }, index) => {
                        const serverElement = serverList.querySelector(`[data-id="${server.id}"]`);
                        if (serverElement) {
                            updateServerCard(serverElement, status);
                            const currentIndex = Array.from(serverList.children).indexOf(serverElement);
                            if (currentIndex !== index) {
                                if (index === 0) {
                                    serverList.prepend(serverElement);
                                } else {
                                    serverList.children[index - 1].after(serverElement);
                                }
                            }
                        }
                    });
                });
        }, 30000);
    }

    // Initialize index servers list
    const indexServersList = document.querySelector('.indesc-servers-list');
    if (indexServersList) {
        const container = indexServersList.parentElement;
        const serversHeader = container.querySelector('.indesc-servers-header');

        function updateIndexServers(mode = 'popular') {
            updateTotalPlayers(false).then(results => {
                const popularServers = getPopularServers(results);
                const activeServers = getActiveServers(results, popularServers);
                
                // If current mode has no servers, switch to other mode
                if (mode === 'popular' && popularServers.length === 0) {
                    mode = 'active';
                } else if (mode === 'active' && activeServers.length === 0) {
                    mode = 'popular';
                }
        
                let displayServers = mode === 'popular' ? popularServers : activeServers;
                
                // If both modes are empty, show "No servers online" message
                if (popularServers.length === 0 && activeServers.length === 0) {
                    indexServersList.innerHTML = `
                        <div class="indesc-no-servers">
                            No servers online
                        </div>
                    `;
                    if (serversHeader) {
                        serversHeader.style.opacity = '0';
                    }
                    return;
                }
        
                // Initial render
                if (indexServersList.children.length === 0) {
                    if (serversHeader) {
                        serversHeader.textContent = mode === 'popular' ? 'Popular Servers' : 'Active Servers';
                        serversHeader.style.opacity = '1';
                    }
                    displayServers.slice(0, 3).forEach(({ server, status }) => {
                        const serverElement = createIndexServerElement(server, status);
                        indexServersList.appendChild(serverElement);
                    });
                    return;
                }
        
                // Get current servers for comparison
                const currentServers = Array.from(indexServersList.children)
                    .filter(el => el.className === 'indesc-server')
                    .map(el => el.querySelector('.indesc-server-name').textContent);
                
                // Get new servers
                const newServers = displayServers.slice(0, 3).map(({ server }) => server.title);
                
                // Check if the servers are the same (ignoring order)
                const areServersEqual = (arr1, arr2) => {
                    return arr1.length === arr2.length && 
                           arr1.every(server => arr2.includes(server));
                };
        
                // Only perform transition if servers actually changed
                if (!areServersEqual(currentServers, newServers)) {
                    if (serversHeader) {
                        serversHeader.style.transition = 'opacity 0.3s ease-out';
                        serversHeader.style.opacity = '0';
                        
                        setTimeout(() => {
                            serversHeader.textContent = mode === 'popular' ? 'Popular Servers' : 'Active Servers';
                            serversHeader.style.opacity = '1';
                        }, 300);
                    }
        
                    // Slide out current servers
                    const servers = indexServersList.querySelectorAll('.indesc-server');
                    servers.forEach(server => {
                        server.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                        server.style.transform = 'translateX(-100%)';
                        server.style.opacity = '0';
                    });
        
                    // After slide out, update content and slide in new servers
                    setTimeout(() => {
                        indexServersList.innerHTML = '';
                        displayServers.slice(0, 3).forEach(({ server, status }) => {
                            const serverElement = createIndexServerElement(server, status);
                            serverElement.style.transform = 'translateX(100%)';
                            serverElement.style.opacity = '0';
                            indexServersList.appendChild(serverElement);
                            
                            requestAnimationFrame(() => {
                                serverElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                                serverElement.style.transform = 'translateX(0)';
                                serverElement.style.opacity = '1';
                            });
                        });
                    }, 300);
                } else {
                    // If servers are the same, just update the values without animation
                    displayServers.slice(0, 3).forEach(({ server, status }, index) => {
                        const existingServer = indexServersList.children[index];
                        if (existingServer) {
                            const playersElement = existingServer.querySelector('.indesc-server-players');
                            if (playersElement) {
                                playersElement.textContent = `${status.players}/${status.maxPlayers} players`;
                            }
                        }
                    });
                }
            });
        }

// Initial load
updateIndexServers('popular');

// Initialize footer if it doesn't exist
if (!container.querySelector('.indesc-servers-footer')) {
const footer = document.createElement('div');
footer.className = 'indesc-servers-footer';
footer.innerHTML = `
<a href="/servers" class="indesc-view-servers">View All Servers</a>
`;
container.appendChild(footer);
}

let currentMode = 'popular';
// Toggle between popular and active servers every 10 seconds
setInterval(() => {
currentMode = currentMode === 'popular' ? 'active' : 'popular';
updateIndexServers(currentMode);
}, 10000);

// Refresh current view every 30 seconds
setInterval(() => {
updateIndexServers(currentMode);
}, 30000);
}
});