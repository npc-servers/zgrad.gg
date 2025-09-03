document.addEventListener('DOMContentLoaded', () => {
    // Trigger landing animations on page load
    const initLandingAnimations = () => {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // Show all elements immediately for users who prefer reduced motion
            const animatedElements = document.querySelectorAll('.landing-logo, .landing-subtitle, .landing-buttons-inline .landing-button, .start-playing-text, .join-button-container .join-section, .join-button-large, .server-info .server-name, .server-info .server-players, .server-info .server-gamemode, .top-row .landing-buttons-inline .landing-button');
            animatedElements.forEach(element => {
                element.style.opacity = '1';
                element.style.transform = 'none';
            });
        } else {
            // Animations will be handled by CSS, just ensure elements are ready
            // The CSS animations will trigger automatically due to the animation properties
        }
    };

    // Initialize animations
    initLandingAnimations();

    const joinButton = document.getElementById('joinMostPopularServer');
    const viewServersButton = document.getElementById('viewServers');
    const joinPlayerCount = document.getElementById('joinPlayerCount');
    const serverName = document.getElementById('serverName');
    const currentGamemode = document.getElementById('currentGamemode');
    const joinSection = document.querySelector('.join-section');
    
    if (joinButton && viewServersButton) {
        // Function to check if device is tablet or mobile
        const isTabletOrMobile = () => {
            return window.innerWidth <= 767; // Consider both mobile and tablet for hiding elements
        };
        
        // For medium screens, we need a separate check (no longer needed)
        const isMediumScreen = () => {
            return false; // No longer treating medium screens differently
        };
        
        // Function to find the most popular server and update the JOIN button
        const updateServerButtons = () => {
            // Use the same server data and status fetching as in servers.js
            const servers = [
                {
                    id: 'zgrad1',
                    title: 'ZGRAD US1',
                    ip: '193.243.190.18',
                    port: 27066,
                    region: 'US',
                    gamemode: 'All Gamemodes',
                    link: 'connect/us1.html'
                },
                {
                    id: 'zgrad2',
                    title: 'ZGRAD US2',
                    ip: '193.243.190.18',
                    port: 27051,
                    region: 'US',
                    gamemode: 'All Gamemodes',
                    link: 'connect/us2.html'
                },
                {
                    id: 'zgrad3',
                    title: 'ZGRAD US3',
                    ip: '193.243.190.18',
                    port: 27053,
                    region: 'US',
                    gamemode: 'Low Loot Rate',
                    link: 'connect/us3.html'
                },
                {
                    id: 'zgrad4',
                    title: 'ZGRAD US4',
                    ip: '193.243.190.18',
                    port: 27052,
                    region: 'US',
                    gamemode: 'Homicide Only',
                    link: 'connect/us4.html'
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
                            gamemode: 'Unknown',
                            server: server // Store the server reference
                        };

                        if (serverInfo && (serverInfo.status?.toLowerCase() === 'online' || serverInfo.players !== undefined)) {
                            status.online = true;
                            status.players = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                            status.maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || "?";
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
                            maxPlayers: 0, 
                            map: 'Unknown',
                            gamemode: 'Unknown',
                            server: server 
                        };
                    });
            };
            
            // Fetch status for all servers
            Promise.all(servers.map(server => fetchServerStatus(server)))
                .then(statuses => {
                    // Filter for online servers
                    const onlineServers = statuses.filter(status => status.online);
                    
                    // Sort by player count (highest first)
                    onlineServers.sort((a, b) => b.players - a.players);
                    
                    // Find the most popular server that isn't full
                    let selectedServer = null;
                    let selectedServerStatus = null;
                    
                    for (const serverStatus of onlineServers) {
                        // Check if server is full (players >= maxPlayers)
                        const isFull = serverStatus.players >= serverStatus.maxPlayers;
                        
                        if (!isFull) {
                            // Found a non-full server
                            selectedServer = serverStatus.server;
                            selectedServerStatus = serverStatus;
                            break;
                        }
                    }
                    
                    // If all servers are full or no servers are online, default to the first server
                    if (!selectedServer) {
                        selectedServer = servers[0];
                        // If there are online servers but all are full, get the first one's status
                        selectedServerStatus = onlineServers.length > 0 ? onlineServers[0] : null;
                    }
                    
                    // Update the JOIN button link
                    joinButton.href = selectedServer.link;
                    
                    // Set VIEW SERVERS button link to servers page
                    viewServersButton.href = "servers.html";
                    
                    // Player icon SVG
                    const playerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="player-icon">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>`;
                            
                    // Steam icon SVG from user
                    const steamIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" class="steam-icon">
                                <path fill="currentColor" d="M15.974 0C7.573 0 .682 6.479.031 14.714l8.573 3.547a4.5 4.5 0 0 1 2.552-.786c.083 0 .167.005.25.005l3.813-5.521v-.078c0-3.328 2.703-6.031 6.031-6.031s6.036 2.708 6.036 6.036a6.04 6.04 0 0 1-6.036 6.031h-.135l-5.438 3.88c0 .073.005.141.005.214c0 2.5-2.021 4.526-4.521 4.526c-2.177 0-4.021-1.563-4.443-3.635L.583 20.36c1.901 6.719 8.063 11.641 15.391 11.641c8.833 0 15.995-7.161 15.995-16s-7.161-16-15.995-16zm-5.922 24.281l-1.964-.813a3.4 3.4 0 0 0 1.755 1.667a3.404 3.404 0 0 0 4.443-1.833a3.38 3.38 0 0 0 .005-2.599a3.36 3.36 0 0 0-1.839-1.844a3.38 3.38 0 0 0-2.5-.042l2.026.839c1.276.536 1.88 2 1.349 3.276s-2 1.88-3.276 1.349zm15.219-12.406a4.025 4.025 0 0 0-4.016-4.021a4.02 4.02 0 1 0 0 8.042a4.02 4.02 0 0 0 4.016-4.021m-7.026-.005c0-1.672 1.349-3.021 3.016-3.021s3.026 1.349 3.026 3.021c0 1.667-1.359 3.021-3.026 3.021s-3.016-1.354-3.016-3.021"/>
                            </svg>`;
                    
                    if (isTabletOrMobile()) {
                        // For mobile and tablet, merge the functionality of both buttons
                        // Hide the original join button in mobile view via CSS
                        
                        // Make "VIEW SERVERS" button visible on mobile/tablet
                        viewServersButton.innerHTML = 'VIEW SERVERS';
                        
                        // Set link for VIEW SERVERS button to also go to the server with most players
                        viewServersButton.href = selectedServer.link;
                        
                        // No need to update hidden elements on mobile/tablet
                        // The elements are now hidden via CSS
                    } else {
                        // For desktop, show proper information on both buttons
                        viewServersButton.innerHTML = 'VIEW SERVERS';
                        
                        if (selectedServerStatus) {
                            const playerCount = selectedServerStatus.players;
                            const maxPlayers = selectedServerStatus.maxPlayers;
                            const selectedServerName = selectedServer.title;
                            const gamemode = selectedServerStatus.gamemode;
                            const map = selectedServerStatus.map;
                            
                            // Update the server name, player count, and gamemode
                            serverName.textContent = selectedServerName;
                            joinPlayerCount.textContent = `${playerCount}/${maxPlayers}`;
                            currentGamemode.innerHTML = `${gamemode} <span style="color: #a8a8a8;">on</span> ${map}`;
                            joinPlayerCount.classList.add('update-animation');
                            
                            setTimeout(() => {
                                joinPlayerCount.classList.remove('update-animation');
                            }, 500);
                            
                            // Update join button text
                            joinButton.textContent = 'JOIN';
                            
                            // Calculate server capacity and apply dynamic colors
                            const playerPercentage = (playerCount / maxPlayers) * 100;
                            
                            // Remove any existing capacity classes from player count, join button, and join section
                            joinPlayerCount.classList.remove('nearly-full', 'getting-full');
                            joinButton.classList.remove('nearly-full', 'getting-full');
                            if (joinSection) {
                                joinSection.classList.remove('nearly-full', 'getting-full');
                            }
                            
                            // Apply dynamic player count color based on capacity
                            if (playerPercentage >= 90) {
                                // 90%+ capacity: Orange
                                joinPlayerCount.classList.add('nearly-full');
                                joinButton.classList.add('nearly-full');
                                if (joinSection) {
                                    joinSection.classList.add('nearly-full');
                                }
                                joinPlayerCount.style.color = '#ff6b00';
                            } else if (playerPercentage >= 70) {
                                // 70-89% capacity: Green (same as normal)
                                joinPlayerCount.classList.add('getting-full');
                                joinButton.classList.add('getting-full');
                                if (joinSection) {
                                    joinSection.classList.add('getting-full');
                                }
                                joinPlayerCount.style.color = '#4CAF50';
                            } else {
                                // Under 70% capacity: Green
                                joinPlayerCount.style.color = '#4CAF50';
                            }
                        } else {
                            // Update for error case
                            serverName.textContent = selectedServer.title;
                            joinPlayerCount.textContent = '0/0';
                            joinPlayerCount.style.color = '#4CAF50';
                            currentGamemode.innerHTML = 'Unknown <span style="color: #a8a8a8;">on</span> Unknown';
                            joinButton.textContent = 'JOIN';
                            joinPlayerCount.classList.remove('nearly-full', 'getting-full');
                            joinButton.classList.remove('nearly-full', 'getting-full');
                            if (joinSection) {
                                joinSection.classList.remove('nearly-full', 'getting-full');
                            }
                        }
                        // No need for mobile class on the new button design
                        
                        // Make sure the "START PLAYING NOW" text is visible on desktop
                        document.querySelector('.start-playing-text').style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error("Error updating server buttons:", error);
                    // Default to first server on error
                    joinButton.href = servers[0].link;
                    viewServersButton.href = "servers.html";
                    
                    // Even on error, display the right message for the device
                    if (isTabletOrMobile()) {
                        viewServersButton.innerHTML = 'VIEW SERVERS';
                        viewServersButton.href = servers[0].link;
                        // No need to update hidden elements on mobile/tablet
                        // The elements are now hidden via CSS
                    } else {
                        viewServersButton.innerHTML = 'VIEW SERVERS';
                        // Update for error case
                        serverName.textContent = servers[0].title;
                        joinPlayerCount.textContent = '0/0';
                        joinPlayerCount.style.color = '#4CAF50';
                        currentGamemode.innerHTML = 'Unknown <span style="color: #a8a8a8;">on</span> Unknown';
                        joinButton.textContent = 'JOIN';
                        joinPlayerCount.classList.remove('nearly-full', 'getting-full');
                        joinButton.classList.remove('nearly-full', 'getting-full');
                        if (joinSection) {
                            joinSection.classList.remove('nearly-full', 'getting-full');
                        }
                        document.querySelector('.start-playing-text').style.display = 'block';
                    }
                });
        };
        
        // Update immediately and then every 30 seconds
        updateServerButtons();
        setInterval(updateServerButtons, 30000);
        
        // Debounced resize handler for better performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateServerButtons, 150); // Debounce resize events by 150ms
        });
    }
}); 