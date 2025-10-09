"use strict";

var isGmod = false;
var isTest = false;
var totalFiles = 1;
var filesNeeded = 1;
var totalCalled = false;
var percentage = 0;
var allow_increment = true;
var currentDownloadingFile = "";
var currentStatus = "Initializing...";
var currentServerName = null;

/**
 * GMod Called Functions - Core loading functionality only
 * These functions are bound to the window object for GMod to call
 */

// Bind GameDetails to window for GMod compatibility
window.GameDetails = function(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    console.log("[LoadingScreen] Joining server:", servername);
    
    isGmod = true;
    isTest = false; // Disable test mode if GMod loads
    
    // Store the server name for filtering
    if (servername) {
        currentServerName = servername;
        
        // Refresh server list to apply the filter now that we know the current server
        fetchAllServerStatus();
    }
};

// Bind SetFilesTotal to window for GMod compatibility
window.SetFilesTotal = function(total) {
    totalCalled = true;
    totalFiles = Math.max(1, total); // Ensure at least 1 to avoid division by zero
    filesNeeded = total; // Reset filesNeeded to match total
    currentDownloadingFile = "";
    
    updatePercentage();
};

// Bind SetFilesNeeded to window for GMod compatibility
window.SetFilesNeeded = function(needed) {
    filesNeeded = Math.max(0, needed);
    updatePercentage();
};

// Bind DownloadingFile to window for GMod compatibility
window.DownloadingFile = function(fileName) {
    // Decrement filesNeeded
    filesNeeded = Math.max(0, filesNeeded - 1);
    
    // Clean up the filename and store it
    if (fileName) {
        currentDownloadingFile = fileName;
        
        // Update status to show we're actively downloading
        if (!currentStatus || currentStatus === "Initializing..." || currentStatus === "Initializing downloads...") {
            currentStatus = "Downloading files...";
        }
    }
    
    // Update percentage after decrementing
    updatePercentage();
};

// Bind SetStatusChanged to window for GMod compatibility
window.SetStatusChanged = function(status) {
    console.log("[LoadingScreen] SetStatusChanged:", status);
    currentStatus = status;
    
    // Clear downloading file when status changes to indicate we're not downloading files anymore
    if (status && (
        status.includes("Workshop Complete") || 
        status.includes("Client info sent") || 
        status.includes("Starting Lua") ||
        status.includes("Lua") ||
        status.includes("Complete")
    )) {
        console.log("[LoadingScreen] Status indicates completion phase - clearing downloading file");
        currentDownloadingFile = "";
    }
    
    // Parse workshop loading progress from status messages like "1/15 (1.8 GB) - Loading 'addon name'"
    if (status && totalCalled) {
        var progressMatch = status.match(/^(\d+)\/(\d+)\s*\(/);
        if (progressMatch) {
            var current = parseInt(progressMatch[1]);
            var total = parseInt(progressMatch[2]);
            
            if (total > 0) {
                // Update filesNeeded based on workshop progress
                filesNeeded = Math.max(0, totalFiles - current);
                console.log("[LoadingScreen] Parsed workshop progress:", current + "/" + total, "- filesNeeded now:", filesNeeded);
                updatePercentage();
            }
        }
    }
    
    // Set percentage to 100% when sending client info (final step)
    if (status && status.includes("Sending client info")) {
        filesNeeded = 0;
        updatePercentage();
    }
};

/**
 * Calculate and update the loading percentage (simple linear calculation)
 */
function updatePercentage() {
    if (!totalCalled || totalFiles <= 0) {
        return;
    }
    
    // Simple calculation: how many files have been downloaded / total files
    var filesDownloaded = Math.max(0, totalFiles - filesNeeded);
    var progress = (filesDownloaded / totalFiles);
    
    // Convert to percentage (0-100) and round
    percentage = Math.round(Math.max(0, Math.min(100, progress * 100)));
}

// Keep the old function names for backward compatibility and internal use
function GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    window.GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode);
}

function SetFilesTotal(total) {
    window.SetFilesTotal(total);
}

function SetFilesNeeded(needed) {
    window.SetFilesNeeded(needed);
}

function DownloadingFile(filename) {
    window.DownloadingFile(filename);
}

function SetStatusChanged(status) {
    window.SetStatusChanged(status);
}

/**
 * Test Mode - Simulate file loading for testing
 */
function startTestMode() {
    isTest = true;
    
    // Reset state for test mode
    percentage = 0;

    GameDetails("Test Server", "test.server.com", "gm_construct", "32", "76561198000000000", "sandbox");

    var totalTestFiles = 100;
    SetFilesTotal(totalTestFiles);

    var testFiles = [
        "materials/models/weapons/ak47/ak47_texture.vtf",
        "sound/weapons/ak47/ak47_fire.wav", 
        "models/weapons/w_ak47.mdl",
        "materials/effects/muzzleflash.vmt",
        "lua/autorun/client/hud_system.lua",
        "materials/gui/health_icon.png",
        "sound/ambient/combat_music.mp3",
        "models/player/terrorist.mdl",
        "materials/models/player/terrorist_body.vtf",
        "lua/weapons/weapon_ak47.lua",
        "materials/models/props/barrel01.vmt",
        "sound/weapons/pistol/pistol_fire.wav",
        "models/props_c17/chair01.mdl",
        "lua/autorun/server/init.lua",
        "materials/sprites/glow01.vmt",
        "sound/ambient/atmosphere/forest_ambience.wav",
        "models/player/combine_soldier.mdl",
        "materials/models/player/combine_soldier_body.vtf",
        "lua/entities/weapon_base/shared.lua",
        "materials/effects/water_splash.vmt"
    ];
    
    var currentFileIndex = 0;
    
    var testInterval = setInterval(function() {
        if (filesNeeded > 0 && currentFileIndex < totalTestFiles) {
            // Use realistic filenames with proper timing
            var fileIndex = currentFileIndex % testFiles.length;
            DownloadingFile(testFiles[fileIndex]); // This will decrement filesNeeded
            currentFileIndex++;
            
            // Add status changes at specific points
            if (filesNeeded === 20) {
                SetStatusChanged("Workshop Complete");
            } else if (filesNeeded === 5) {
                SetStatusChanged("Client info sent!");
            } else if (filesNeeded === 0) {
                SetStatusChanged("Starting Lua...");
                clearInterval(testInterval);
            }
        }
    }, 50);

    SetStatusChanged("Loading workshop content...");
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
 * Get the current loading status based on percentage and state
 */
function getCurrentStatus() {
    if (!isGmod && !isTest) {
        return "Waiting for game...";
    }
    
    // Check for gluapack in current status or downloading file
    if ((currentStatus && currentStatus.toLowerCase().includes("gluapack")) ||
        (currentDownloadingFile && currentDownloadingFile.toLowerCase().includes("gluapack"))) {
        return "Downloading super-fast bundled lua";
    }
    
    // If we have a specific status from GMod, use that (but only if we're not actively downloading)
    if (currentStatus && currentStatus !== "" && (!currentDownloadingFile || currentDownloadingFile === "")) {
        // Check for important status messages that should be displayed
        if (currentStatus.includes("Starting Lua") || 
            currentStatus.includes("Client info sent") || 
            currentStatus.includes("Workshop Complete") ||
            currentStatus.includes("Lua") ||
            currentStatus.includes("Complete")) {
            return currentStatus;
        }
    }
    
    // If we're actively downloading a file, show that with priority
    if (currentDownloadingFile && currentDownloadingFile !== "") {
        // Clean up filename for display
        var displayName = currentDownloadingFile;
        
        // Remove common path prefixes to show just the filename
        if (displayName.includes("/")) {
            displayName = displayName.split("/").pop();
        }
        if (displayName.includes("\\")) {
            displayName = displayName.split("\\").pop();
        }
        
        // Truncate very long filenames but keep extension
        if (displayName.length > 35) {
            var nameWithoutExt = displayName.substring(0, displayName.lastIndexOf('.'));
            var ext = displayName.substring(displayName.lastIndexOf('.'));
            if (nameWithoutExt.length > 30) {
                displayName = nameWithoutExt.substring(0, 27) + "..." + ext;
            }
        }
        
        return "Downloading: " + displayName;
    }
    
    // Show current status if we have one and no file is downloading
    if (currentStatus && currentStatus !== "" && currentStatus !== "Initializing..." && currentStatus !== "Initializing downloads...") {
        return currentStatus;
    }
    
    // Fallback to simple status based on percentage
    if (percentage >= 100) {
        return "Starting Lua...";
    } else if (percentage > 0) {
        return "Downloading files...";
    } else {
        return "Initializing...";
    }
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
    console.log("[LoadingScreen] ====================================");
    
    // Initialize UI elements
    setTimeout(initializeUI, 100);
    
    // Auto-start test mode if not loaded by GMod after 2 seconds
    setTimeout(function() {
        if (!isGmod && !isTest) {
            console.log("[LoadingScreen] No GMod detected after 2 seconds - starting TEST MODE");
            startTestMode();
        } else if (isGmod) {
            console.log("[LoadingScreen] GMod detected - running in PRODUCTION MODE");
        }
    }, 2000);
}); 