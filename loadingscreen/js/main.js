"use strict";

var isGmod = false;
var totalFiles = 0;
var filesNeeded = 0;
var percentage = 0;
var currentDownloadingFile = "";
var currentStatus = "";
var currentServerName = null;

/**
 * GMod Called Functions - Core loading functionality only
 * These functions are bound to the window object for GMod to call
 * 
 * Implementation follows the official Garry's Mod Wiki specification:
 * https://wiki.facepunch.com/gmod/Loading_URL
 */

/**
 * Called at the start when the loading screen finishes loading all assets.
 * @param {string} servername - Server's name (hostname convar)
 * @param {string} serverurl - URL for the loading screen (sv_loadingurl convar)
 * @param {string} mapname - The name of the map the server is playing
 * @param {number} maxplayers - Maximum number of players (maxplayers convar)
 * @param {string} steamid - 64-bit numeric Steam community ID of the client
 * @param {string} gamemode - The gamemode the server is playing (gamemode convar)
 * @param {number} volume - Value of player's 'snd_musicvolume' console variable (0 to 1)
 * @param {string} language - Value of player's 'gmod_language' console variable (two letter code)
 */
window.GameDetails = function(servername, serverurl, mapname, maxplayers, steamid, gamemode, volume, language) {
    console.log("[LoadingScreen] GameDetails received");
    console.log("[LoadingScreen] Server:", servername);
    console.log("[LoadingScreen] Map:", mapname);
    console.log("[LoadingScreen] Gamemode:", gamemode);
    console.log("[LoadingScreen] Max Players:", maxplayers);
    
    isGmod = true;
    
    // Reset loading state
    totalFiles = 0;
    filesNeeded = 0;
    percentage = 0;
    currentDownloadingFile = "";
    currentStatus = "";
    
    // Store the server name for filtering in server list
    if (servername) {
        currentServerName = servername;
        
        // Refresh server list to filter out the current server
        fetchAllServerStatus();
    }
};

/**
 * Called at the start with the total number of files the client will download.
 * @param {number} total - Total number of files to download
 */
window.SetFilesTotal = function(total) {
    console.log("[LoadingScreen] SetFilesTotal:", total);
    
    totalFiles = Math.max(0, total);
    filesNeeded = totalFiles;
    
    updatePercentage();
};

/**
 * Called when the number of files remaining for the client to download changes.
 * @param {number} needed - Number of files left to download
 */
window.SetFilesNeeded = function(needed) {
    console.log("[LoadingScreen] SetFilesNeeded:", needed);
    
    filesNeeded = Math.max(0, needed);
    
    updatePercentage();
};

/**
 * Called when the client starts downloading a file.
 * This is purely informational - just store and display the filename.
 * GMod will call SetFilesNeeded separately to update the progress.
 * @param {string} fileName - Full path and name of the file being downloaded
 */
window.DownloadingFile = function(fileName) {
    console.log("[LoadingScreen] DownloadingFile:", fileName);
    
    // Simply store the current file being downloaded for display
    currentDownloadingFile = fileName || "";
};

/**
 * Called when the client's joining status changes.
 * @param {string} status - Current joining status (e.g., "Starting Lua...")
 */
window.SetStatusChanged = function(status) {
    console.log("[LoadingScreen] SetStatusChanged:", status);
    
    currentStatus = status || "";
    
    // Clear the downloading file display when we move past the downloading phase
    if (status && (
        status.includes("Workshop Complete") || 
        status.includes("Client info sent") || 
        status.includes("Starting Lua") ||
        status.includes("Sending client info")
    )) {
        currentDownloadingFile = "";
    }
};

/**
 * Calculate and update the loading percentage based on files downloaded.
 */
function updatePercentage() {
    if (totalFiles <= 0) {
        percentage = 0;
        return;
    }
    
    // Calculate progress: (downloaded / total) * 100
    var filesDownloaded = Math.max(0, totalFiles - filesNeeded);
    var progress = filesDownloaded / totalFiles;
    
    // Convert to percentage (0-100)
    var newPercentage = Math.round(Math.max(0, Math.min(100, progress * 100)));
    
    // Log only when percentage changes
    if (newPercentage !== percentage) {
        console.log("[LoadingScreen] Progress:", newPercentage + "% (" + filesDownloaded + "/" + totalFiles + " files)");
    }
    
    percentage = newPercentage;
}

/**
 * UI Integration - Updates the visual loading screen elements
 */
var lastPercentage = 0;
var lastStatus = "";

// DOM elements
var loadingBar = null;
var loadingPercentage = null;
var loadingStatus = null;
var logoSubtext = null;
var advertTitle = null;
var advertSubtext = null;
var serverListElement = null;
var totalPlayersCountElement = null;
var backgroundElement = null;

// Configuration for rotating messages
var config = {
    // Logo subtext messages (below the logo)
    logoSubtextMessages: [
        'Your feedback is important, make suggestions and vote on our Discord!',
        'You can support us on our webstore, <a href="https://store.npcz.gg" target="_blank">store.npcz.gg</a>!',
        'Fart',
        'We release updates nearly every day!',
        'Coming from social media? Be sure to join our Discord!'
    ],
    
    // Bottom left advert messages
    advertMessages: [
        {
            title: "DID YOU KNOW?",
            subtitle: "You can type !settings to change your keybinds!"
        },
        {
            title: "TIRED OF FULL SERVERS?",
            subtitle: "Get a reserved slot on our webstore: https://store.npcz.gg!"
        },
        {
            title: "DID YOU KNOW?", 
            subtitle: "You can use A and D to grab while climbing!"
        },
        {
            title: "POST YOUR CLIPS!",
            subtitle: "We have a clip section on our Discord! Post your clips for a chance for them to be featured on our socials!"
        },
        {
            title: "ARE YOU IN OUR DISCORD?",
            subtitle: "We've been working on a complete overhaul of the gunplay, and playtests are soon! Don't miss out, join the Discord and signup!"
        },
        {
            title: "GET CUSTOM PLAYERMODELS!",
            subtitle: "Go to https://store.npcz.gg to unlock our custom playermodel system! (You also get so much more!!!)"
        },
        {
            title: "GIVEAWAYS!?!?",
            subtitle: "We giveaway hundreds of dollars worth of ranks on our Discord every month!"
        },
        
    ],
    
    // Background images for rotation
    backgroundImages: [
        '../../images/homigrad-render.png',
        '../../images/homigrad-render2.png',
        '../../images/maps/zgr_harbor.png',
        '../../images/maps/zgr_mineral.png',
    ],
    
    // Rotation intervals (in milliseconds)
    logoSubtextInterval: 8000,  // 8 seconds
    advertInterval: 12000,      // 12 seconds
    backgroundInterval: 15000,  // 15 seconds
    
    // Server configuration - easily configurable IPs and titles
    servers: [
        {
            id: 'zgrad1',
            title: 'ZGRAD US1',
            ip: '193.243.190.18',
            port: 27066,
            region: 'US',
            gamemode: 'All Gamemodes',
            logo: '../images/logos/zgrad-logopiece-z.png'
        },
        {
            id: 'zgrad2',
            title: 'ZGRAD US2',
            ip: '193.243.190.18',
            port: 27051,
            region: 'US',
            gamemode: 'All Gamemodes',
            logo: '../images/logos/zgrad-logopiece-z.png'
        },
        {
            id: 'zgrad3',
            title: 'ZGRAD US3',
            ip: '193.243.190.18',
            port: 27053,
            region: 'US',
            gamemode: 'TDM 24/7',
            logo: '../images/logos/zgrad-logopiece-z.png'
        },
        {
            id: 'zgrad4',
            title: 'ZGRAD US4',
            ip: '193.243.190.18',
            port: 27052,
            region: 'US',
            gamemode: 'Homicide Only',
            logo: '../images/logos/zgrad-logopiece-z.png'
        },
        {
            id: 'npcz',
            title: 'NPC Zombies Vs. Players',
            ip: '193.243.190.18',
            port: 27015,
            region: 'US',
            gamemode: 'Sandbox',
            logo: '../images/logos/npcz.png'
        },
        {
            id: 'horde',
            title: 'HORDE',
            ip: '193.243.190.18',
            port: 27065,
            region: 'US',
            gamemode: 'Horde',
            logo: '../images/logos/npcz.png'
        },
        {
            id: 'zbox',
            title: 'ZBOX',
            ip: '193.243.190.18',
            port: 27017,
            region: 'US',
            gamemode: 'Sandbox',
            logo: '../images/logos/npcz.png'
        },
        {
            id: 'zscenario',
            title: 'ZSCENARIO',
            ip: '193.243.190.18',
            port: 27018,
            region: 'US',
            gamemode: 'Scenario',
            logo: '../images/logos/npcz.png'
        },
        {
            id: 'mapsweepers',
            title: 'MAPSWEEPERS',
            ip: '193.243.190.18',
            port: 27019,
            region: 'US',
            gamemode: 'Minesweeper',
            logo: '../images/logos/npcz.png'
        }
    ]
};

// Rotation state
var currentLogoMessageIndex = 0;
var currentAdvertMessageIndex = 0;
var lastLogoMessageIndex = -1;
var lastAdvertMessageIndex = -1;
var lastBackgroundUrl = "";
var logoSubtextRotationInterval = null;
var advertRotationInterval = null;
var backgroundRotationInterval = null;

/**
 * Get a random index from an array, avoiding the last used index
 */
function getRandomIndex(arrayLength, lastIndex) {
    if (arrayLength <= 1) return 0;
    
    var newIndex;
    do {
        newIndex = Math.floor(Math.random() * arrayLength);
    } while (newIndex === lastIndex);
    
    return newIndex;
}

/**
 * Get a random background URL that's different from the last one
 */
function getRandomBackground() {
    var availableBackgrounds = config.backgroundImages.filter(function(bg) {
        return bg !== lastBackgroundUrl;
    });
    
    if (availableBackgrounds.length === 0) {
        availableBackgrounds = config.backgroundImages;
    }
    
    var randomIndex = Math.floor(Math.random() * availableBackgrounds.length);
    return availableBackgrounds[randomIndex];
}

/**
 * Initialize UI elements when DOM is ready
 */
function initializeUI() {
    loadingBar = document.getElementById('loadingBar');
    loadingPercentage = document.getElementById('loadingPercentage');
    loadingStatus = document.getElementById('loadingStatus');
    logoSubtext = document.getElementById('logoSubtext');
    advertTitle = document.querySelector('.advert-title');
    advertSubtext = document.querySelector('.advert-subtext');
    serverListElement = document.getElementById('loadingScreenServerList');
    totalPlayersCountElement = document.getElementById('totalPlayersCount');
    backgroundElement = document.querySelector('.background');
    
    
    // Start the UI update loop
    updateUI();
    
    // Start message rotations
    startLogoSubtextRotation();
    startAdvertRotation();
    startBackgroundRotation();
    
    // Initialize server list
    initializeServerList();
}

/**
 * Update the UI elements based on current loading state
 */
function updateUI() {
    if (loadingBar && loadingPercentage && loadingStatus) {
        // Update percentage display and progress bar
        if (lastPercentage !== percentage) {
            lastPercentage = percentage;
            loadingPercentage.textContent = percentage + '%';
            loadingPercentage.setAttribute('data-percentage', percentage + '%');
            
            // Calculate when the progress bar actually covers the text
            // Get the actual left position from CSS custom property or computed styles
            var progressContainer = loadingPercentage.parentElement;
            var containerWidth = progressContainer.offsetWidth;
            var containerComputedStyle = window.getComputedStyle(progressContainer);
            var customPropertyValue = containerComputedStyle.getPropertyValue('--percentage-left').trim();
            var textPosition = customPropertyValue ? parseInt(customPropertyValue) : 8; // Fallback to 8px if not set
            var textWidth = loadingPercentage.offsetWidth;
            var textEndPosition = textPosition + textWidth;
            
            // Calculate the percentage when progress bar reaches the end of the text
            var textCoveragePercentage = (textEndPosition / containerWidth) * 100;
            
            // Calculate how much of the text should be revealed based on current progress
            var currentProgressPixels = (percentage / 100) * containerWidth;
            var textRevealPercentage = Math.max(0, Math.min(100, 
                ((currentProgressPixels - textPosition) / textWidth) * 100
            ));
            
            loadingPercentage.style.setProperty('--progress-width', textRevealPercentage + '%');
            loadingBar.style.width = percentage + '%';
        }
        
        // Update status text (this will be set by the SetStatusChanged function)
        var currentStatus = getCurrentStatus();
        if (lastStatus !== currentStatus) {
            lastStatus = currentStatus;
            loadingStatus.textContent = currentStatus;
        }
    }
    
    // Continue updating
    requestAnimationFrame(updateUI);
}

/**
 * Get the current loading status to display to the user.
 * Priority: Gluapack special case > Status changes > Currently downloading file > Fallback based on progress
 */
function getCurrentStatus() {
    if (!isGmod) {
        return "Waiting for game...";
    }
    
    // Priority 1: Special handling for gluapack downloads
    if ((currentStatus && currentStatus.toLowerCase().includes("gluapack")) ||
        (currentDownloadingFile && currentDownloadingFile.toLowerCase().includes("gluapack"))) {
        return "Downloading super-fast bundled lua";
    }
    
    // Priority 2: Show GMod status updates when provided
    // These are important messages like "Starting Lua...", "Workshop Complete", etc.
    if (currentStatus && currentStatus !== "") {
        return currentStatus;
    }
    
    // Priority 3: Show currently downloading file
    if (currentDownloadingFile && currentDownloadingFile !== "") {
        var displayName = cleanupFileName(currentDownloadingFile);
        return "Downloading: " + displayName;
    }
    
    // Priority 4: Fallback to generic status based on progress
    if (percentage >= 100) {
        return "Complete!";
    } else if (percentage > 0) {
        return "Downloading files...";
    } else {
        return "Initializing...";
    }
}

/**
 * Clean up a file path for display - extract filename and truncate if needed
 */
function cleanupFileName(filePath) {
    var displayName = filePath;
    
    // Extract just the filename from the path
    if (displayName.includes("/")) {
        displayName = displayName.split("/").pop();
    }
    if (displayName.includes("\\")) {
        displayName = displayName.split("\\").pop();
    }
    
    // Truncate very long filenames but preserve the extension
    if (displayName.length > 35) {
        var lastDotIndex = displayName.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            var nameWithoutExt = displayName.substring(0, lastDotIndex);
            var ext = displayName.substring(lastDotIndex);
            if (nameWithoutExt.length > 30) {
                displayName = nameWithoutExt.substring(0, 27) + "..." + ext;
            }
        } else {
            // No extension, just truncate
            displayName = displayName.substring(0, 32) + "...";
        }
    }
    
    return displayName;
}

/**
 * Start the logo subtext rotation system
 */
function startLogoSubtextRotation() {
    if (!logoSubtext) return;
    
    // Set initial random message
    currentLogoMessageIndex = Math.floor(Math.random() * config.logoSubtextMessages.length);
    lastLogoMessageIndex = currentLogoMessageIndex;
    updateLogoSubtextMessage();
    
    // Start rotation interval
    logoSubtextRotationInterval = setInterval(function() {
        currentLogoMessageIndex = getRandomIndex(config.logoSubtextMessages.length, lastLogoMessageIndex);
        lastLogoMessageIndex = currentLogoMessageIndex;
        updateLogoSubtextMessage();
    }, config.logoSubtextInterval);
}

/**
 * Update the logo subtext message with no animation
 */
function updateLogoSubtextMessage() {
    if (!logoSubtext) return;
    
    // Simply change the message directly
    logoSubtext.innerHTML = config.logoSubtextMessages[currentLogoMessageIndex];
}

/**
 * Start the advert rotation system
 */
function startAdvertRotation() {
    if (!advertTitle || !advertSubtext) return;
    
    // Set initial random message
    currentAdvertMessageIndex = Math.floor(Math.random() * config.advertMessages.length);
    lastAdvertMessageIndex = currentAdvertMessageIndex;
    updateAdvertMessage();
    
    // Start rotation interval
    advertRotationInterval = setInterval(function() {
        currentAdvertMessageIndex = getRandomIndex(config.advertMessages.length, lastAdvertMessageIndex);
        lastAdvertMessageIndex = currentAdvertMessageIndex;
        updateAdvertMessage();
    }, config.advertInterval);
}

/**
 * Update the advert message with no animation
 */
function updateAdvertMessage() {
    if (!advertTitle || !advertSubtext) return;
    
    var currentAdvert = config.advertMessages[currentAdvertMessageIndex];
    
    // Update title and subtitle
    advertTitle.textContent = currentAdvert.title;
    advertTitle.setAttribute('data-text', currentAdvert.title);
    advertSubtext.textContent = currentAdvert.subtitle;
}

/**
 * Set a random background immediately
 */
function setRandomBackground(isInitial) {
    if (!backgroundElement) return;
    
    var randomBackground = getRandomBackground();
    lastBackgroundUrl = randomBackground;
    
    // Disable transition for initial load
    if (isInitial) {
        backgroundElement.style.transition = 'none';
        backgroundElement.style.backgroundImage = 'url(' + randomBackground + ')';
        
        // Re-enable transition after a short delay
        setTimeout(function() {
            backgroundElement.style.transition = 'background-image 2s ease-in-out';
        }, 50);
    } else {
        backgroundElement.style.backgroundImage = 'url(' + randomBackground + ')';
    }
    
}

/**
 * Start the background rotation system
 */
function startBackgroundRotation() {
    if (!backgroundElement) {
        return;
    }
    
    // Set random background immediately (no transition)
    setRandomBackground(true);
    
    // Start rotation interval (with transitions)
    backgroundRotationInterval = setInterval(function() {
        setRandomBackground(false);
    }, config.backgroundInterval);
}

/**
 * Update the total player count display
 */
function updateTotalPlayerCount(totalPlayers) {
    if (!totalPlayersCountElement) return;
    
    var numberElement = totalPlayersCountElement.querySelector('.total-players-number');
    if (numberElement) {
        numberElement.textContent = totalPlayers;
    }
}

/**
 * Server Management Functions
 */

// Server status tracking
var serverElements = new Map();
var serverUpdateInterval = null;

/**
 * Initialize the server list
 */
function initializeServerList() {
    if (!serverListElement) return;
    
    
    // Start fetching server data immediately
    fetchAllServerStatus();
    
    // Set up periodic updates every 30 seconds
    serverUpdateInterval = setInterval(fetchAllServerStatus, 30000);
}

/**
 * Fetch server status from API
 */
function fetchServerStatus(server) {
    return fetch("https://gameserveranalytics.com/api/v2/query?game=source&ip=" + server.ip + "&port=" + server.port + "&type=info")
        .then(function(response) { return response.json(); })
        .then(function(serverInfo) {
            var status = {
                online: false,
                players: 0,
                maxPlayers: 0,
                map: 'Unknown',
                gamemode: server.gamemode,
                server: server
            };

            if (serverInfo && (serverInfo.status && serverInfo.status.toLowerCase() === 'online' || serverInfo.players !== undefined)) {
                status.online = true;
                status.players = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                status.maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || 32;
                status.map = serverInfo.map || 'Unknown';
                
                // Extract gamemode from server name if available
                var serverTitle = serverInfo.name || serverInfo.hostname || '';
                var gamemodeMatch = serverTitle.match(/Now Playing:\s*([^|]+)/i);
                if (gamemodeMatch) {
                    status.gamemode = gamemodeMatch[1].trim();
                }
            }

            return status;
        })
        .catch(function(error) {
            console.error("Error fetching data for " + server.id + ":", error);
            return { 
                online: false, 
                players: 0, 
                maxPlayers: 32, 
                map: 'Unknown',
                gamemode: server.gamemode,
                server: server 
            };
        });
}

/**
 * Fetch status for all servers
 */
function fetchAllServerStatus() {
    if (!serverListElement) return;
    
    
    // Get all servers first to fetch their status
    var serverPromises = config.servers.map(function(server) {
        return fetchServerStatus(server);
    });
    
    Promise.all(serverPromises).then(function(serverStatuses) {
        // Calculate total player count across all servers
        var totalPlayers = serverStatuses.reduce(function(total, serverStatus) {
            return total + (serverStatus.online ? serverStatus.players : 0);
        }, 0);
        
        // Update the total player count display
        updateTotalPlayerCount(totalPlayers);
        
        // Filter out the current server if we have that information
        var serversToShow = serverStatuses.filter(function(serverStatus) {
            if (!currentServerName) {
                return true;
            }
            
            var server = serverStatus.server;
            // Use case-insensitive token-based matching since GMod sends various formats:
            // - "ZGRAD.GG US1 | Now Playing: TDM"
            // - "NPCZ | Horde - discord.gg/npc"
            // - "Map Sweepers Official Server | ZMOD.GG"
            // - "ZBox | random words"
            
            // Tokenize both names by splitting on special characters
            var gmodName = currentServerName.toLowerCase();
            var configTitle = server.title.toLowerCase();
            
            // Extract meaningful tokens (alphanumeric sequences)
            var gmodTokens = gmodName.match(/[a-z0-9]+/g) || [];
            var configTokens = configTitle.match(/[a-z0-9]+/g) || [];
            
            // Check if all config tokens are present in GMod tokens
            var isSameServer = configTokens.every(function(token) {
                return gmodTokens.indexOf(token) !== -1;
            });
            
            if (isSameServer) {
                console.log("[LoadingScreen] Filtering out current server:", server.title);
            }
            
            return !isSameServer;
        });
        
        // Sort servers by player count (highest to lowest)
        serversToShow.sort(function(a, b) {
            // Online servers take priority over offline servers
            if (a.online && !b.online) return -1;
            if (!a.online && b.online) return 1;
            
            // If both are online or both are offline, sort by player count
            return b.players - a.players;
        });
        
        // Limit to maximum 4 servers AFTER sorting
        serversToShow = serversToShow.slice(0, 4);
        
        if (serversToShow.length === 0) {
            // If all servers are filtered out, show a message
            serverListElement.innerHTML = '<div class="server-loading">You\'re joining one of our servers!</div>';
            return;
        }
        
        updateServerList(serversToShow);
    }).catch(function(error) {
        console.error("Error fetching server statuses:", error);
    });
}

/**
 * Update the server list display
 */
function updateServerList(serverStatuses) {
    if (!serverListElement) return;
    
    // Clear loading message
    serverListElement.innerHTML = '';
    
    serverStatuses.forEach(function(serverStatus) {
        var serverElement = createServerElement(serverStatus);
        serverListElement.appendChild(serverElement);
    });
    
    // Add footer message
    var footerMessage = document.createElement('div');
    footerMessage.className = 'server-list-footer';
    footerMessage.textContent = 'TYPE !SERVERS IN-GAME TO CONNECT TO OUR SERVERS!';
    serverListElement.appendChild(footerMessage);
}

/**
 * Create a server element
 */
function createServerElement(serverStatus) {
    var server = serverStatus.server;
    var isOnline = serverStatus.online;
    var playerCount = serverStatus.players;
    var maxPlayers = serverStatus.maxPlayers;
    var playerPercentage = maxPlayers > 0 ? (playerCount / maxPlayers) * 100 : 0;
    
    // Determine player count color classes and server capacity classes
    var playerCountClass = '';
    var serverCapacityClass = '';
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
    
    var serverDiv = document.createElement('div');
    serverDiv.className = 'loading-screen-server-item ' + serverCapacityClass;
    serverDiv.setAttribute('data-server-id', server.id);
    
    if (isOnline) {
        serverDiv.innerHTML = 
            '<div class="loading-screen-server-header">' +
                '<img src="' + server.logo + '" alt="' + server.title + ' Logo" class="loading-screen-server-logo">' +
                '<div class="loading-screen-server-name">' + server.title + '</div>' +
            '</div>' +
            '<div class="loading-screen-server-players"><span class="' + playerCountClass + '">' + playerCount + '/' + maxPlayers + '</span> players online</div>' +
            '<div class="loading-screen-server-gamemode">Now Playing: <span>' + serverStatus.gamemode + '</span> <span style="color: #a8a8a8;">on</span> ' + serverStatus.map + '</div>';
    } else {
        serverDiv.innerHTML = 
            '<div class="loading-screen-server-header">' +
                '<img src="' + server.logo + '" alt="' + server.title + ' Logo" class="loading-screen-server-logo">' +
                '<div class="loading-screen-server-name">' + server.title + '</div>' +
            '</div>' +
            '<div class="loading-screen-server-offline">Server is offline</div>';
    }
    
    return serverDiv;
}

/**
 * Initialize the loading system
 */
document.addEventListener("DOMContentLoaded", function() {
    console.log("[LoadingScreen] ====================================");
    console.log("[LoadingScreen] ZGRAD Loading Screen Initialized");
    console.log("[LoadingScreen] Waiting for GMod callbacks...");
    console.log("[LoadingScreen] Wiki-compliant implementation");
    console.log("[LoadingScreen] https://wiki.facepunch.com/gmod/Loading_URL");
    console.log("[LoadingScreen] ====================================");
    
    // Initialize UI elements
    setTimeout(initializeUI, 100);
}); 