"use strict";

var isGmod = false;
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
    
    // Reset state for real GMod loading
    totalFiles = 1;
    filesNeeded = 1;
    totalCalled = false;
    percentage = 0;
    currentDownloadingFile = "";
    currentStatus = "Initializing...";
    
    // Store the server name for filtering
    if (servername) {
        currentServerName = servername;
        
        // Refresh server list to apply the filter now that we know the current server
        fetchAllServerStatus();
    }
};

// Bind SetFilesTotal to window for GMod compatibility
window.SetFilesTotal = function(total) {
    console.log("[LoadingScreen] SetFilesTotal called with total:", total);
    
    var previousTotal = totalFiles;
    totalCalled = true;
    totalFiles = Math.max(1, total); // Ensure at least 1 to avoid division by zero
    
    // Only reset filesNeeded if this is the first time or if we need to increase it
    // This preserves progress made during workshop loading
    if (previousTotal === 1 || filesNeeded > total) {
        filesNeeded = total;
        console.log("[LoadingScreen] Total files set to:", total);
    } else {
        console.log("[LoadingScreen] Preserving existing progress - filesNeeded:", filesNeeded, "totalFiles:", totalFiles);
    }
    
    currentDownloadingFile = "";
    
    updatePercentage();
};

// Bind SetFilesNeeded to window for GMod compatibility
window.SetFilesNeeded = function(needed) {
    console.log("[LoadingScreen] SetFilesNeeded called - needed:", needed, "total:", totalFiles);
    filesNeeded = Math.max(0, needed);
    updatePercentage();
};

// Bind DownloadingFile to window for GMod compatibility
window.DownloadingFile = function(fileName) {
    console.log("[LoadingScreen] DownloadingFile:", fileName);
    
    // Only decrement filesNeeded if we're in the actual file downloading phase
    // (after SetFilesTotal has been called with a meaningful value)
    // Don't decrement during workshop loading phase
    if (totalCalled && totalFiles > 1) {
        filesNeeded = Math.max(0, filesNeeded - 1);
        console.log("[LoadingScreen] Decremented filesNeeded to:", filesNeeded);
    } else {
        console.log("[LoadingScreen] Ignoring DownloadingFile (workshop phase) - totalCalled:", totalCalled, "totalFiles:", totalFiles);
    }
    
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
    var newPercentage = Math.round(Math.max(0, Math.min(100, progress * 100)));
    
    // Only log if percentage changed
    if (newPercentage !== percentage) {
        console.log("[LoadingScreen] Progress updated:", newPercentage + "% (" + filesDownloaded + "/" + totalFiles + " files downloaded)");
    }
    
    percentage = newPercentage;
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
        'You can get 35% on all ranks until December 31st!',
        'You can support us on our webstore, <a href="https://store.zmod.gg" target="_blank">store.zmod.gg</a>!',
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
            subtitle: "Get a reserved slot on our webstore: https://store.zmod.gg!"
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
            subtitle: "Go to https://store.zmod.gg to unlock our custom playermodel system! (You also get so much more!!!)"
        },
        {
            title: "GIVEAWAYS!?!?",
            subtitle: "We giveaway hundreds of dollars worth of ranks on our Discord every month!"
        },
        
    ],
    
    // Background images for rotation
    backgroundImages: [
        '../../images/homigrad-render.png',
        '../../images/homigrad-render2.jpg',
        '../../images/loadingscreen/bathroom.jpg',
        '../../images/loadingscreen/bloody-mess.jpg',
        '../../images/loadingscreen/eighteenth.jpg',
        '../../images/loadingscreen/eigth.jpg',
        '../../images/loadingscreen/fatboy.jpg',
        '../../images/loadingscreen/fifth.JPG',
        '../../images/loadingscreen/fourteenth.jpg',
        '../../images/loadingscreen/homigrad-essence.jpg',
        '../../images/loadingscreen/kill-room.jpg',
        '../../images/loadingscreen/massacre.jpg',
        '../../images/loadingscreen/ninth.JPG',
        '../../images/loadingscreen/ptsd.jpg',
        '../../images/loadingscreen/seventh.JPG',
        '../../images/loadingscreen/sixth-no-branding.jpg',
        '../../images/loadingscreen/sixth.jpg',
        '../../images/loadingscreen/street-war.jpg',
        '../../images/loadingscreen/thirteenth.jpg',
        '../../images/loadingscreen/traitor.jpg',
        '../../images/loadingscreen/twelth.jpg',
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
var backgroundImageQueue = [];
var currentBackgroundQueueIndex = 0;

/**
 * Initialize the background image queue
 */
function initializeBackgroundQueue() {
    // Create a shuffled copy of the background images array
    backgroundImageQueue = config.backgroundImages.slice().sort(function() {
        return Math.random() - 0.5;
    });
    currentBackgroundQueueIndex = 0;
}

/**
 * Get the next background image from the queue
 */
function getNextBackgroundFromQueue() {
    if (backgroundImageQueue.length === 0) {
        // Queue is empty, reinitialize with shuffled images
        initializeBackgroundQueue();
    }
    
    var nextBackground = backgroundImageQueue[currentBackgroundQueueIndex];
    currentBackgroundQueueIndex++;
    
    return nextBackground;
}

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
 * Initialize UI elements when DOM is ready
 */
function initializeUI() {
    loadingBar = document.getElementById('loadingBar');
    loadingPercentage = document.getElementById('loadingPercentage');
    loadingStatus = document.getElementById('loadingStatus');
    advertTitle = document.querySelector('.advert-title');
    advertSubtext = document.querySelector('.advert-subtext');
    serverListElement = document.getElementById('loadingScreenServerList');
    totalPlayersCountElement = document.getElementById('totalPlayersCount');
    backgroundElement = document.querySelector('.background');
    
    // Start the UI update loop
    updateUI();
    
    // Initialize background queue
    initializeBackgroundQueue();
    
    // Fetch sale from CMS API, then initialize sale banner
    fetchActiveSale().then(function() {
        // Initialize sale banner from config (populated by API)
        initializeSaleBanner();
    });
    
    // Fetch event/news from CMS API, then initialize event banner
    fetchLoadingScreenNews().then(function() {
        // Initialize event banner with data from API (or defaults if API failed)
        initializeEventBanner();
        
        // Schedule update display (condense social media and show updates)
        setTimeout(showLatestUpdate, 3000);
    });
    
    // Start message rotations
    startAdvertRotation();
    startBackgroundRotation();
    
    // Initialize server list
    initializeServerList();
}

/**
 * Updates Integration
 */
var allUpdates = [];
var currentUpdateIndex = 0;
var updateCycleInterval = null;

// Sale banner configuration - will be populated from API
var saleConfig = {
    enabled: false,
    percentage: "",
    title: "",
    description: "",
    linkText: "",
    linkUrl: ""
};

// Event/News items from CMS API (up to 3 events + 1 news)
var loadingScreenItems = [];
var currentLoadingScreenItemIndex = 0;

// Current event config (populated from loadingScreenItems)
var eventConfig = {
    enabled: false,
    type: 'news',
    title: "",
    description: "",
    endDate: null,
    linkUrl: ""
};

// Track which panel to show next: 'update', 'sale', 'event'
var nextPanelType = 'event'; // Start with event/news first

// Track how many updates have been shown since last special panel
var updatesSinceLastSpecial = 0;
var updatesBeforeSpecial = 5;
var lastSpecialPanel = null;

/**
 * Fetch active sale from CMS API for loading screen
 */
function fetchActiveSale() {
    return fetch("/api/sales/active")
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.active && data.sale) {
                // Populate saleConfig from API response
                saleConfig.enabled = true;
                saleConfig.percentage = data.sale.percentage || "";
                saleConfig.title = data.sale.title || "";
                saleConfig.description = data.sale.description || "";
                saleConfig.linkText = data.sale.linkText || "";
                saleConfig.linkUrl = data.sale.linkUrl || "";
                
                console.log("[LoadingScreen] Loaded active sale from CMS:", saleConfig.title);
                return true;
            } else {
                saleConfig.enabled = false;
                console.log("[LoadingScreen] No active sale from CMS");
                return false;
            }
        })
        .catch(function(error) {
            console.error("[LoadingScreen] Error fetching sale:", error);
            saleConfig.enabled = false;
            return false;
        });
}

/**
 * Fetch event/news from CMS API for loading screen
 */
function fetchLoadingScreenNews() {
    return fetch("/api/news/loading-screen")
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.active && data.items && data.items.length > 0) {
                // Store all items
                loadingScreenItems = data.items;
                currentLoadingScreenItemIndex = 0;
                
                // Set the first item as current
                setCurrentLoadingScreenItem(0);
                
                console.log("[LoadingScreen] Loaded " + loadingScreenItems.length + " event/news items from CMS");
                return true;
            } else {
                loadingScreenItems = [];
                eventConfig.enabled = false;
                console.log("[LoadingScreen] No active event/news from CMS");
                return false;
            }
        })
        .catch(function(error) {
            console.error("[LoadingScreen] Error fetching event/news:", error);
            loadingScreenItems = [];
            eventConfig.enabled = false;
            return false;
        });
}

/**
 * Set the current loading screen item from the items array
 */
function setCurrentLoadingScreenItem(index) {
    if (loadingScreenItems.length === 0) {
        eventConfig.enabled = false;
        return;
    }
    
    var item = loadingScreenItems[index];
    eventConfig.enabled = true;
    eventConfig.type = item.type === 'event' ? 'event' : 'news';
    eventConfig.title = item.title || '';
    eventConfig.description = item.description || '';
    eventConfig.linkUrl = item.linkUrl || '';
    eventConfig.endDate = item.endDate ? new Date(item.endDate) : null;
}

/**
 * Move to the next loading screen item
 */
function nextLoadingScreenItem() {
    if (loadingScreenItems.length === 0) return;
    
    currentLoadingScreenItemIndex = (currentLoadingScreenItemIndex + 1) % loadingScreenItems.length;
    setCurrentLoadingScreenItem(currentLoadingScreenItemIndex);
}

/**
 * Initialize sale banner from config
 */
function initializeSaleBanner() {
    var percentageEl = document.getElementById('salePercentage');
    var titleEl = document.getElementById('saleTitle');
    var descriptionEl = document.getElementById('saleDescription');
    var linkEl = document.getElementById('saleLink');
    
    if (percentageEl) {
        percentageEl.innerHTML = saleConfig.percentage + '<br>OFF';
    }
    if (titleEl) {
        titleEl.textContent = saleConfig.title;
    }
    if (descriptionEl) {
        descriptionEl.innerHTML = saleConfig.description;
    }
    if (linkEl) {
        linkEl.textContent = saleConfig.linkText;
        linkEl.href = saleConfig.linkUrl;
    }
}

/**
 * Initialize event banner from config
 */
function initializeEventBanner() {
    // Set up countdown timer to update every minute
    setInterval(updateEventCountdown, 60000);
    
    // Initialize content if we have items
    if (loadingScreenItems.length > 0) {
        updateEventBannerContent();
    }
}

/**
 * Update event countdown timer
 */
function updateEventCountdown() {
    var countdownEl = document.getElementById('eventCountdown');
    if (!countdownEl || !eventConfig.endDate) return;
    
    var now = new Date();
    var endDate = eventConfig.endDate;
    var diff = endDate - now;
    
    if (diff <= 0) {
        countdownEl.textContent = 'Event ended';
        return;
    }
    
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        countdownEl.textContent = 'Event ends in ' + days + ' day' + (days !== 1 ? 's' : '') + ', ' + hours + ' hour' + (hours !== 1 ? 's' : '');
    } else if (hours > 0) {
        countdownEl.textContent = 'Event ends in ' + hours + ' hour' + (hours !== 1 ? 's' : '');
    } else {
        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        countdownEl.textContent = 'Event ends in ' + minutes + ' minute' + (minutes !== 1 ? 's' : '');
    }
}

function fetchAllUpdates() {
    // Fetch all updates
    return fetch("/api/updates/list?limit=100&offset=0")
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.updates && data.updates.length > 0) {
                return data.updates;
            }
            return [];
        })
        .catch(function(error) {
            console.error("[LoadingScreen] Error fetching updates:", error);
            return [];
        });
}

function fetchLatestUpdate() {
    // Fetch only 1 update
    return fetch("/api/updates/list?limit=1&offset=0")
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.updates && data.updates.length > 0) {
                return data.updates[0];
            }
            return null;
        })
        .catch(function(error) {
            console.error("[LoadingScreen] Error fetching updates:", error);
            return null;
        });
}

function processUpdateContent(content) {
    if (!content) return '';
    
    // Basic HTML escaping
    var div = document.createElement('div');
    div.textContent = content;
    var processed = div.innerHTML;
    
    // Remove Discord references
    processed = processed.replace(/&lt;[@#:][^&]+?&gt;/g, '');
    
    // Remove Discord CDN links
    processed = processed.replace(
        /https:\/\/cdn\.discordapp\.com\/attachments\/[\d]+\/[\d]+\/[^\s<]+(\?[^\s<]*)?/gi,
        ''
    );
    
    // Process lines for badges
    var lines = processed.split('\n');
    processed = lines.map(function(line) {
        var trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('+')) {
            return '<span class="changelog-badge changelog-added">ADDED</span> ' + trimmedLine.substring(1).trim();
        }
        if (trimmedLine.startsWith('\\+')) {
            return '<span class="changelog-badge changelog-added">ADDED</span> ' + trimmedLine.substring(2).trim();
        }
        if (trimmedLine.startsWith('×') || trimmedLine.startsWith('x')) {
            return '<span class="changelog-badge changelog-changed">CHANGED</span> ' + trimmedLine.substring(1).trim();
        }
        if (trimmedLine.startsWith('-')) {
            return '<span class="changelog-badge changelog-removed">REMOVED</span> ' + trimmedLine.substring(1).trim();
        }
        if (trimmedLine.startsWith('\\-')) {
            return '<span class="changelog-badge changelog-removed">REMOVED</span> ' + trimmedLine.substring(2).trim();
        }
        if (trimmedLine.startsWith('*')) {
            return '<span class="bullet-point">•</span> ' + trimmedLine.substring(1).trim();
        }
        if (trimmedLine.startsWith('\\*')) {
            return '<span class="bullet-point">•</span> ' + trimmedLine.substring(2).trim();
        }
        return line;
    }).join('\n');
    
    // Basic formatting
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__(.+?)__/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]*)\)/g, function(match, text, url) {
        if (url && url.trim()) {
            return '<a href="' + url + '" target="_blank">' + text + '</a>';
        }
        return text;
    });
    
    // Paragraphs
    var paragraphs = processed.split('\n\n').filter(function(p) { return p.trim(); });
    if (paragraphs.length > 1) {
        processed = paragraphs.map(function(p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
    } else {
        processed = processed.replace(/\n/g, '<br>');
    }
    
    return processed;
}

function getUpdateLabel(timestamp, isLatest) {
    var updateDate = new Date(timestamp);
    var today = new Date();
    
    // Reset time parts for accurate day comparison
    today.setHours(0, 0, 0, 0);
    updateDate.setHours(0, 0, 0, 0);
    
    var diffTime = today - updateDate;
    var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return "TODAY'S UPDATE";
    } else if (diffDays === 1) {
        return "YESTERDAY'S UPDATE";
    } else {
        return "PAST UPDATE";
    }
}

function displayUpdate(update, isLatest) {
    var updateContent = document.getElementById('latestUpdateContent');
    var updateDate = document.getElementById('latestUpdateDate');
    var updateLabel = document.getElementById('latestUpdateLabel');
    var authorAvatar = document.getElementById('authorAvatar');
    var authorName = document.getElementById('authorName');
    
    if (!updateContent || !updateDate || !updateLabel) return;
    
    // Prepare update content
    var date = new Date(update.timestamp);
    updateDate.textContent = date.toLocaleDateString();
    updateContent.innerHTML = processUpdateContent(update.content);
    
    // Update the label dynamically
    updateLabel.textContent = getUpdateLabel(update.timestamp, isLatest);
    
    // Update author information
    if (authorAvatar && update.author_id) {
        var avatarUrl;
        if (update.author_avatar && update.author_avatar !== 'null') {
            avatarUrl = 'https://cdn.discordapp.com/avatars/' + update.author_id + '/' + update.author_avatar + '.png';
        } else {
            // Calculate default avatar index based on user ID
            var defaultAvatarIndex = Number(BigInt(update.author_id) >> 22n) % 6;
            avatarUrl = 'https://cdn.discordapp.com/embed/avatars/' + defaultAvatarIndex + '.png';
        }
        authorAvatar.src = avatarUrl;
    }
    if (authorName && update.author_username) {
        authorName.textContent = update.author_username;
    }
}

function hideAllPanels() {
    var updateContainer = document.getElementById('latestUpdateContainer');
    var saleContainer = document.getElementById('saleBannerContainer');
    var eventContainer = document.getElementById('eventBannerContainer');
    
    if (updateContainer) updateContainer.classList.remove('visible');
    if (saleContainer) saleContainer.classList.remove('visible');
    if (eventContainer) eventContainer.classList.remove('visible');
}

function showSaleBanner() {
    var saleContainer = document.getElementById('saleBannerContainer');
    
    if (!saleContainer || !saleConfig.enabled) {
        // If sale is disabled, try event or skip to update
        if (eventConfig.enabled) {
            showEventBanner();
        } else {
            showNextUpdate();
        }
        return;
    }
    
    // Hide any visible panel
    hideAllPanels();
    
    // Wait for fade out animation, then show sale
    setTimeout(function() {
        saleContainer.classList.add('visible');
        
        // Reset the counter and mark that we showed sale
        updatesSinceLastSpecial = 0;
        lastSpecialPanel = 'sale';
        
        // Schedule next cycle - switch to update after 15 seconds
        nextPanelType = 'update';
        setTimeout(showNextPanel, 15000);
    }, 400);
}

function showEventBanner() {
    var eventContainer = document.getElementById('eventBannerContainer');
    
    if (!eventContainer || !eventConfig.enabled || loadingScreenItems.length === 0) {
        // If no events/news, try sale or skip to update
        if (saleConfig.enabled) {
            showSaleBanner();
        } else {
            showNextUpdate();
        }
        return;
    }
    
    // Hide any visible panel
    hideAllPanels();
    
    // Wait for fade out animation, then show event
    setTimeout(function() {
        // Update banner content with current item
        updateEventBannerContent();
        
        eventContainer.classList.add('visible');
        
        // Move to next item for next time
        nextLoadingScreenItem();
        
        // Decide what to show next
        // After cycling through all items, show sale (if enabled), then updates
        if (currentLoadingScreenItemIndex === 0) {
            // We've cycled through all items
            if (saleConfig.enabled) {
                nextPanelType = 'sale';
            } else {
                nextPanelType = 'update';
                updatesSinceLastSpecial = 0;
            }
        } else {
            // More items to show
            nextPanelType = 'event';
        }
        
        setTimeout(showNextPanel, 15000);
    }, 400);
}

/**
 * Update event banner DOM content with current eventConfig
 */
function updateEventBannerContent() {
    var titleEl = document.getElementById('eventTitle');
    var descriptionEl = document.getElementById('eventDescription');
    var countdownEl = document.getElementById('eventCountdown');
    var linkEl = document.getElementById('eventLink');
    var calendarIcon = document.getElementById('eventIconCalendar');
    var megaphoneIcon = document.getElementById('eventIconMegaphone');
    
    if (titleEl) {
        titleEl.textContent = eventConfig.title;
    }
    if (descriptionEl) {
        descriptionEl.innerHTML = eventConfig.description;
    }
    
    // Show correct icon based on type
    if (eventConfig.type === 'event') {
        if (calendarIcon) calendarIcon.classList.add('visible');
        if (megaphoneIcon) megaphoneIcon.classList.remove('visible');
    } else {
        if (megaphoneIcon) megaphoneIcon.classList.add('visible');
        if (calendarIcon) calendarIcon.classList.remove('visible');
    }
    
    if (countdownEl) {
        if (eventConfig.type === 'event' && eventConfig.endDate) {
            countdownEl.style.display = '';
            updateEventCountdown();
        } else {
            countdownEl.style.display = 'none';
        }
    }
    
    if (linkEl) {
        if (eventConfig.linkUrl) {
            linkEl.textContent = eventConfig.linkUrl;
            linkEl.href = 'https://' + eventConfig.linkUrl;
            linkEl.classList.add('visible');
        } else {
            linkEl.classList.remove('visible');
        }
    }
}

function showNextPanel() {
    if (nextPanelType === 'event') {
        if (loadingScreenItems.length > 0) {
            showEventBanner();
        } else if (saleConfig.enabled) {
            showSaleBanner();
        } else {
            showNextUpdate();
        }
    } else if (nextPanelType === 'sale') {
        if (saleConfig.enabled) {
            showSaleBanner();
        } else if (loadingScreenItems.length > 0) {
            showEventBanner();
        } else {
            showNextUpdate();
        }
    } else {
        showNextUpdate();
    }
}

function showNextUpdate() {
    var updateContainer = document.getElementById('latestUpdateContainer');
    
    if (!updateContainer || allUpdates.length === 0) return;
    
    // Hide any visible panel
    hideAllPanels();
    
    // Wait for fade out animation to complete (400ms matches CSS transition)
    setTimeout(function() {
        // Move to next update
        currentUpdateIndex = (currentUpdateIndex + 1) % allUpdates.length;
        var nextUpdate = allUpdates[currentUpdateIndex];
        var isLatest = currentUpdateIndex === 0;
        
        // Display the update content
        displayUpdate(nextUpdate, isLatest);
        
        // Show update container
        updateContainer.classList.add('visible');
        
        // Track updates shown
        updatesSinceLastSpecial++;
        
        // After configured number of updates, go back to events/news
        if (updatesSinceLastSpecial >= updatesBeforeSpecial && loadingScreenItems.length > 0) {
            nextPanelType = 'event';
        } else if (updatesSinceLastSpecial >= updatesBeforeSpecial && saleConfig.enabled) {
            nextPanelType = 'sale';
        } else {
            nextPanelType = 'update';
        }
        
        setTimeout(showNextPanel, 15000);
    }, 400);
}

function showLatestUpdate() {
    var updateContainer = document.getElementById('latestUpdateContainer');
    
    if (!updateContainer) return;
    
    // Fetch all updates first
    fetchAllUpdates().then(function(updates) {
        if (!updates || updates.length === 0) {
            console.log("[LoadingScreen] No updates found to display");
        } else {
            // Store all updates
            allUpdates = updates;
            currentUpdateIndex = -1; // Start at -1 so first showNextUpdate goes to index 0
            
            // Display the first (latest) update content but don't show yet
            var latestUpdate = allUpdates[0];
            displayUpdate(latestUpdate, true);
        }
        
        // Always start with event/news if available, then sale, then updates
        if (loadingScreenItems.length > 0) {
            showEventBanner();
        } else if (saleConfig.enabled) {
            showSaleBanner();
        } else if (allUpdates.length > 0) {
            // Show update container directly
            currentUpdateIndex = 0;
            updateContainer.classList.add('visible');
            updatesSinceLastSpecial = 1;
            nextPanelType = 'update';
            setTimeout(showNextPanel, 15000);
        }
    });
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
    if (!isGmod) {
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
 * Logo subtext rotation disabled - now static
 */
function startLogoSubtextRotation() {
    // Rotation disabled - logo subtext is now static
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
    
    var randomBackground = getNextBackgroundFromQueue();
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
});