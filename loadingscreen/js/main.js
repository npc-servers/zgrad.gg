"use strict";

// ============================================================================
// State Management
// ============================================================================

const STATE = {
    isGmod: false,
    isTest: false,
    totalFiles: 1,
    filesNeeded: 1,
    totalCalled: false,
    percentage: 0,
    currentDownloadingFile: "",
    currentStatus: "Initializing...",
    currentServerName: null,
    testModeInterval: null,
    lastPercentage: 0,
    lastStatus: ""
};

// ============================================================================
// GMod Callback Functions
// ============================================================================

window.GameDetails = function(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    console.log("[LoadingScreen] Joining server:", servername);
    
    if (STATE.testModeInterval) {
        console.log("[LoadingScreen] Stopping test mode - real GMod detected");
        clearInterval(STATE.testModeInterval);
        STATE.testModeInterval = null;
    }
    
    Object.assign(STATE, {
        isGmod: true,
        isTest: false,
        totalFiles: 1,
        filesNeeded: 1,
        totalCalled: false,
        percentage: 0,
        currentDownloadingFile: "",
        currentStatus: "Initializing...",
        currentServerName: servername || null
    });
    
    if (servername) {
        fetchAllServerStatus();
    }
};

window.SetFilesTotal = function(total) {
    console.log("[LoadingScreen] SetFilesTotal called with total:", total);
    
    const previousTotal = STATE.totalFiles;
    STATE.totalCalled = true;
    STATE.totalFiles = Math.max(1, total);
    
    if (previousTotal === 1 || STATE.filesNeeded > total) {
        STATE.filesNeeded = total;
        console.log("[LoadingScreen] Total files set to:", total);
    } else {
        console.log("[LoadingScreen] Preserving existing progress - filesNeeded:", STATE.filesNeeded, "totalFiles:", STATE.totalFiles);
    }
    
    STATE.currentDownloadingFile = "";
    updatePercentage();
};

window.SetFilesNeeded = function(needed) {
    console.log("[LoadingScreen] SetFilesNeeded called - needed:", needed, "total:", STATE.totalFiles);
    STATE.filesNeeded = Math.max(0, needed);
    updatePercentage();
};

window.DownloadingFile = function(fileName) {
    console.log("[LoadingScreen] DownloadingFile:", fileName);
    
    if (STATE.totalCalled && STATE.totalFiles > 1) {
        STATE.filesNeeded = Math.max(0, STATE.filesNeeded - 1);
        console.log("[LoadingScreen] Decremented filesNeeded to:", STATE.filesNeeded);
    } else {
        console.log("[LoadingScreen] Ignoring DownloadingFile (workshop phase) - totalCalled:", STATE.totalCalled, "totalFiles:", STATE.totalFiles);
    }
    
    if (fileName) {
        STATE.currentDownloadingFile = fileName;
        
        if (!STATE.currentStatus || STATE.currentStatus === "Initializing..." || STATE.currentStatus === "Initializing downloads...") {
            STATE.currentStatus = "Downloading files...";
        }
    }
    
    updatePercentage();
};

window.SetStatusChanged = function(status) {
    console.log("[LoadingScreen] SetStatusChanged:", status);
    STATE.currentStatus = status;
    
    const completionKeywords = ["Workshop Complete", "Client info sent", "Starting Lua", "Lua", "Complete"];
    if (status && completionKeywords.some(keyword => status.includes(keyword))) {
        console.log("[LoadingScreen] Status indicates completion phase - clearing downloading file");
        STATE.currentDownloadingFile = "";
    }
    
    if (status && STATE.totalCalled) {
        const progressMatch = status.match(/^(\d+)\/(\d+)\s*\(/);
        if (progressMatch) {
            const current = parseInt(progressMatch[1], 10);
            const total = parseInt(progressMatch[2], 10);
            
            if (total > 0) {
                STATE.filesNeeded = Math.max(0, STATE.totalFiles - current);
                console.log(`[LoadingScreen] Parsed workshop progress: ${current}/${total} - filesNeeded now: ${STATE.filesNeeded}`);
                updatePercentage();
            }
        }
    }
    
    if (status && status.includes("Sending client info")) {
        STATE.filesNeeded = 0;
        updatePercentage();
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

function updatePercentage() {
    if (!STATE.totalCalled || STATE.totalFiles <= 0) {
        return;
    }
    
    const filesDownloaded = Math.max(0, STATE.totalFiles - STATE.filesNeeded);
    const progress = filesDownloaded / STATE.totalFiles;
    const newPercentage = Math.round(Math.max(0, Math.min(100, progress * 100)));
    
    if (newPercentage !== STATE.percentage) {
        console.log(`[LoadingScreen] Progress updated: ${newPercentage}% (${filesDownloaded}/${STATE.totalFiles} files downloaded)`);
        STATE.percentage = newPercentage;
    }
}

// ============================================================================
// Test Mode
// ============================================================================

function startTestMode() {
    STATE.isTest = true;
    STATE.percentage = 0;

    window.GameDetails("Test Server", "test.server.com", "gm_construct", "32", "76561198000000000", "sandbox");

    const totalTestFiles = 100;
    window.SetFilesTotal(totalTestFiles);

    const testFiles = [
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
    
    let currentFileIndex = 0;
    
    STATE.testModeInterval = setInterval(() => {
        if (STATE.filesNeeded > 0 && currentFileIndex < totalTestFiles) {
            const fileIndex = currentFileIndex % testFiles.length;
            window.DownloadingFile(testFiles[fileIndex]);
            currentFileIndex++;
            
            if (STATE.filesNeeded === 20) {
                window.SetStatusChanged("Workshop Complete");
            } else if (STATE.filesNeeded === 5) {
                window.SetStatusChanged("Client info sent!");
            } else if (STATE.filesNeeded === 0) {
                window.SetStatusChanged("Starting Lua...");
                clearInterval(STATE.testModeInterval);
                STATE.testModeInterval = null;
            }
        }
    }, 50);

    window.SetStatusChanged("Loading workshop content...");
}

// ============================================================================
// UI Configuration & DOM Elements
// ============================================================================

const DOM = {
    loadingBar: null,
    loadingPercentage: null,
    loadingStatus: null,
    logoSubtext: null,
    advertTitle: null,
    advertSubtext: null,
    serverListElement: null,
    totalPlayersCountElement: null,
    backgroundElement: null
};

const CONFIG = {
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

const ROTATION_STATE = {
    currentLogoMessageIndex: 0,
    currentAdvertMessageIndex: 0,
    lastLogoMessageIndex: -1,
    lastAdvertMessageIndex: -1,
    lastBackgroundUrl: "",
    logoSubtextRotationInterval: null,
    advertRotationInterval: null,
    backgroundRotationInterval: null
};

// ============================================================================
// Utility Functions
// ============================================================================

function getRandomIndex(arrayLength, lastIndex) {
    if (arrayLength <= 1) return 0;
    
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * arrayLength);
    } while (newIndex === lastIndex);
    
    return newIndex;
}

function getRandomBackground() {
    let availableBackgrounds = CONFIG.backgroundImages.filter(bg => bg !== ROTATION_STATE.lastBackgroundUrl);
    
    if (availableBackgrounds.length === 0) {
        availableBackgrounds = CONFIG.backgroundImages;
    }
    
    return availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)];
}

function truncateFilename(filename, maxLength = 35, keepExtLength = 27) {
    if (filename.length <= maxLength) return filename;
    
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return filename.substring(0, maxLength - 3) + '...';
    
    const nameWithoutExt = filename.substring(0, lastDotIndex);
    const ext = filename.substring(lastDotIndex);
    
    if (nameWithoutExt.length > keepExtLength) {
        return nameWithoutExt.substring(0, keepExtLength - 3) + '...' + ext;
    }
    
    return filename;
}

// ============================================================================
// UI Management
// ============================================================================

function initializeUI() {
    Object.assign(DOM, {
        loadingBar: document.getElementById('loadingBar'),
        loadingPercentage: document.getElementById('loadingPercentage'),
        loadingStatus: document.getElementById('loadingStatus'),
        logoSubtext: document.getElementById('logoSubtext'),
        advertTitle: document.querySelector('.advert-title'),
        advertSubtext: document.querySelector('.advert-subtext'),
        serverListElement: document.getElementById('loadingScreenServerList'),
        totalPlayersCountElement: document.getElementById('totalPlayersCount'),
        backgroundElement: document.querySelector('.background')
    });
    
    updateUI();
    startLogoSubtextRotation();
    startAdvertRotation();
    startBackgroundRotation();
    initializeServerList();
}

function updateUI() {
    if (DOM.loadingBar && DOM.loadingPercentage && DOM.loadingStatus) {
        if (STATE.lastPercentage !== STATE.percentage) {
            STATE.lastPercentage = STATE.percentage;
            DOM.loadingPercentage.textContent = `${STATE.percentage}%`;
            DOM.loadingPercentage.setAttribute('data-percentage', `${STATE.percentage}%`);
            
            const progressContainer = DOM.loadingPercentage.parentElement;
            const containerWidth = progressContainer.offsetWidth;
            const containerComputedStyle = window.getComputedStyle(progressContainer);
            const customPropertyValue = containerComputedStyle.getPropertyValue('--percentage-left').trim();
            const textPosition = customPropertyValue ? parseInt(customPropertyValue, 10) : 8;
            const textWidth = DOM.loadingPercentage.offsetWidth;
            
            const currentProgressPixels = (STATE.percentage / 100) * containerWidth;
            const textRevealPercentage = Math.max(0, Math.min(100, 
                ((currentProgressPixels - textPosition) / textWidth) * 100
            ));
            
            DOM.loadingPercentage.style.setProperty('--progress-width', `${textRevealPercentage}%`);
            DOM.loadingBar.style.width = `${STATE.percentage}%`;
        }
        
        const currentStatus = getCurrentStatus();
        if (STATE.lastStatus !== currentStatus) {
            STATE.lastStatus = currentStatus;
            DOM.loadingStatus.textContent = currentStatus;
        }
    }
    
    requestAnimationFrame(updateUI);
}

function getCurrentStatus() {
    if (!STATE.isGmod && !STATE.isTest) {
        return "Waiting for game...";
    }
    
    const statusLower = STATE.currentStatus?.toLowerCase() || "";
    const fileLower = STATE.currentDownloadingFile?.toLowerCase() || "";
    
    if (statusLower.includes("gluapack") || fileLower.includes("gluapack")) {
        return "Downloading super-fast bundled lua";
    }
    
    const importantKeywords = ["Starting Lua", "Client info sent", "Workshop Complete", "Lua", "Complete"];
    if (STATE.currentStatus && !STATE.currentDownloadingFile && 
        importantKeywords.some(keyword => STATE.currentStatus.includes(keyword))) {
        return STATE.currentStatus;
    }
    
    if (STATE.currentDownloadingFile) {
        let displayName = STATE.currentDownloadingFile.split(/[/\\]/).pop();
        displayName = truncateFilename(displayName);
        return `Downloading: ${displayName}`;
    }
    
    if (STATE.currentStatus && 
        STATE.currentStatus !== "Initializing..." && 
        STATE.currentStatus !== "Initializing downloads...") {
        return STATE.currentStatus;
    }
    
    if (STATE.percentage >= 100) return "Starting Lua...";
    if (STATE.percentage > 0) return "Downloading files...";
    return "Initializing...";
}

// ============================================================================
// Message Rotation
// ============================================================================

function startLogoSubtextRotation() {
    if (!DOM.logoSubtext) return;
    
    ROTATION_STATE.currentLogoMessageIndex = Math.floor(Math.random() * CONFIG.logoSubtextMessages.length);
    ROTATION_STATE.lastLogoMessageIndex = ROTATION_STATE.currentLogoMessageIndex;
    updateLogoSubtextMessage();
    
    ROTATION_STATE.logoSubtextRotationInterval = setInterval(() => {
        ROTATION_STATE.currentLogoMessageIndex = getRandomIndex(
            CONFIG.logoSubtextMessages.length, 
            ROTATION_STATE.lastLogoMessageIndex
        );
        ROTATION_STATE.lastLogoMessageIndex = ROTATION_STATE.currentLogoMessageIndex;
        updateLogoSubtextMessage();
    }, CONFIG.logoSubtextInterval);
}

function updateLogoSubtextMessage() {
    if (!DOM.logoSubtext) return;
    DOM.logoSubtext.innerHTML = CONFIG.logoSubtextMessages[ROTATION_STATE.currentLogoMessageIndex];
}

function startAdvertRotation() {
    if (!DOM.advertTitle || !DOM.advertSubtext) return;
    
    ROTATION_STATE.currentAdvertMessageIndex = Math.floor(Math.random() * CONFIG.advertMessages.length);
    ROTATION_STATE.lastAdvertMessageIndex = ROTATION_STATE.currentAdvertMessageIndex;
    updateAdvertMessage();
    
    ROTATION_STATE.advertRotationInterval = setInterval(() => {
        ROTATION_STATE.currentAdvertMessageIndex = getRandomIndex(
            CONFIG.advertMessages.length, 
            ROTATION_STATE.lastAdvertMessageIndex
        );
        ROTATION_STATE.lastAdvertMessageIndex = ROTATION_STATE.currentAdvertMessageIndex;
        updateAdvertMessage();
    }, CONFIG.advertInterval);
}

function updateAdvertMessage() {
    if (!DOM.advertTitle || !DOM.advertSubtext) return;
    
    const currentAdvert = CONFIG.advertMessages[ROTATION_STATE.currentAdvertMessageIndex];
    DOM.advertTitle.textContent = currentAdvert.title;
    DOM.advertTitle.setAttribute('data-text', currentAdvert.title);
    DOM.advertSubtext.textContent = currentAdvert.subtitle;
}

// ============================================================================
// Background Rotation
// ============================================================================

function setRandomBackground(isInitial) {
    if (!DOM.backgroundElement) return;
    
    const randomBackground = getRandomBackground();
    ROTATION_STATE.lastBackgroundUrl = randomBackground;
    
    if (isInitial) {
        DOM.backgroundElement.style.transition = 'none';
        DOM.backgroundElement.style.backgroundImage = `url(${randomBackground})`;
        
        setTimeout(() => {
            DOM.backgroundElement.style.transition = 'background-image 2s ease-in-out';
        }, 50);
    } else {
        DOM.backgroundElement.style.backgroundImage = `url(${randomBackground})`;
    }
}

function startBackgroundRotation() {
    if (!DOM.backgroundElement) return;
    
    setRandomBackground(true);
    
    ROTATION_STATE.backgroundRotationInterval = setInterval(() => {
        setRandomBackground(false);
    }, CONFIG.backgroundInterval);
}

// ============================================================================
// Server Management
// ============================================================================

const SERVER_STATE = {
    elements: new Map(),
    updateInterval: null
};

function updateTotalPlayerCount(totalPlayers) {
    if (!DOM.totalPlayersCountElement) return;
    
    const numberElement = DOM.totalPlayersCountElement.querySelector('.total-players-number');
    if (numberElement) {
        numberElement.textContent = totalPlayers;
    }
}

function initializeServerList() {
    if (!DOM.serverListElement) return;
    
    fetchAllServerStatus();
    SERVER_STATE.updateInterval = setInterval(fetchAllServerStatus, 30000);
}

async function fetchServerStatus(server) {
    try {
        const response = await fetch(
            `https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`
        );
        const serverInfo = await response.json();
        
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
            
            const serverTitle = serverInfo.name || serverInfo.hostname || '';
            const gamemodeMatch = serverTitle.match(/Now Playing:\s*([^|]+)/i);
            if (gamemodeMatch) {
                status.gamemode = gamemodeMatch[1].trim();
            }
        }

        return status;
    } catch (error) {
        console.error(`Error fetching data for ${server.id}:`, error);
        return { 
            online: false, 
            players: 0, 
            maxPlayers: 32, 
            map: 'Unknown',
            gamemode: server.gamemode,
            server: server 
        };
    }
}

async function fetchAllServerStatus() {
    if (!DOM.serverListElement) return;
    
    try {
        const serverStatuses = await Promise.all(CONFIG.servers.map(fetchServerStatus));
        
        const totalPlayers = serverStatuses.reduce((total, status) => 
            total + (status.online ? status.players : 0), 0
        );
        
        updateTotalPlayerCount(totalPlayers);
        
        let serversToShow = serverStatuses.filter(serverStatus => {
            if (!STATE.currentServerName) return true;
            
            const gmodTokens = STATE.currentServerName.toLowerCase().match(/[a-z0-9]+/g) || [];
            const configTokens = serverStatus.server.title.toLowerCase().match(/[a-z0-9]+/g) || [];
            
            const isSameServer = configTokens.every(token => gmodTokens.includes(token));
            
            if (isSameServer) {
                console.log("[LoadingScreen] Filtering out current server:", serverStatus.server.title);
            }
            
            return !isSameServer;
        });
        
        serversToShow.sort((a, b) => {
            if (a.online && !b.online) return -1;
            if (!a.online && b.online) return 1;
            return b.players - a.players;
        });
        
        serversToShow = serversToShow.slice(0, 4);
        
        if (serversToShow.length === 0) {
            DOM.serverListElement.innerHTML = '<div class="server-loading">You\'re joining one of our servers!</div>';
            return;
        }
        
        updateServerList(serversToShow);
    } catch (error) {
        console.error("Error fetching server statuses:", error);
    }
}

function updateServerList(serverStatuses) {
    if (!DOM.serverListElement) return;
    
    DOM.serverListElement.innerHTML = '';
    
    serverStatuses.forEach(serverStatus => {
        const serverElement = createServerElement(serverStatus);
        DOM.serverListElement.appendChild(serverElement);
    });
    
    const footerMessage = document.createElement('div');
    footerMessage.className = 'server-list-footer';
    footerMessage.textContent = 'TYPE !SERVERS IN-GAME TO CONNECT TO OUR SERVERS!';
    DOM.serverListElement.appendChild(footerMessage);
}

function createServerElement(serverStatus) {
    const { server, online, players, maxPlayers, gamemode, map } = serverStatus;
    const playerPercentage = maxPlayers > 0 ? (players / maxPlayers) * 100 : 0;
    
    let playerCountClass = '';
    let serverCapacityClass = '';
    
    if (online) {
        if (playerPercentage >= 90) {
            playerCountClass = serverCapacityClass = 'nearly-full';
        } else if (playerPercentage >= 70) {
            playerCountClass = serverCapacityClass = 'getting-full';
        }
    } else {
        serverCapacityClass = 'offline';
    }
    
    const serverDiv = document.createElement('div');
    serverDiv.className = `loading-screen-server-item ${serverCapacityClass}`;
    serverDiv.setAttribute('data-server-id', server.id);
    
    if (online) {
        serverDiv.innerHTML = `
            <div class="loading-screen-server-header">
                <img src="${server.logo}" alt="${server.title} Logo" class="loading-screen-server-logo">
                <div class="loading-screen-server-name">${server.title}</div>
            </div>
            <div class="loading-screen-server-players">
                <span class="${playerCountClass}">${players}/${maxPlayers}</span> players online
            </div>
            <div class="loading-screen-server-gamemode">
                Now Playing: <span>${gamemode}</span> <span style="color: #a8a8a8;">on</span> ${map}
            </div>`;
    } else {
        serverDiv.innerHTML = `
            <div class="loading-screen-server-header">
                <img src="${server.logo}" alt="${server.title} Logo" class="loading-screen-server-logo">
                <div class="loading-screen-server-name">${server.title}</div>
            </div>
            <div class="loading-screen-server-offline">Server is offline</div>`;
    }
    
    return serverDiv;
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("[LoadingScreen] ====================================");
    console.log("[LoadingScreen] ZGRAD Loading Screen Initialized");
    console.log("[LoadingScreen] Waiting for GMod callbacks...");
    console.log("[LoadingScreen] ====================================");
    
    setTimeout(initializeUI, 100);
    
    setTimeout(() => {
        if (!STATE.isGmod && !STATE.isTest) {
            console.log("[LoadingScreen] No GMod detected after 2 seconds - starting TEST MODE");
            startTestMode();
        } else if (STATE.isGmod) {
            console.log("[LoadingScreen] GMod detected - running in PRODUCTION MODE");
        }
    }, 2000);
}); 