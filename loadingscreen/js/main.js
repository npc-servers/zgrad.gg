"use strict";

var isGmod = false;
var isTest = false;
var totalFiles = 50;
var totalCalled = false;
var percentage = 0;
var allow_increment = true;
var currentDownloadingFile = "";
var currentStatus = "Initializing...";

/**
 * GMod Called Functions - Core loading functionality only
 */
function GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    isGmod = true;
    console.log("GameDetails called:", { servername, serverurl, mapname, maxplayers, steamid, gamemode });
}

function SetFilesTotal(total) {
    totalCalled = true;
    totalFiles = total;
    console.log("SetFilesTotal:", total);
}

function SetFilesNeeded(needed) {
    if (totalCalled) {
        var calculatedPercentage = 100 - Math.round((needed / totalFiles) * 100);
        percentage = Math.round(Math.max(0, Math.min(100, calculatedPercentage)));
        console.log("SetFilesNeeded:", needed, "Percentage:", percentage);
    }
}

function DownloadingFile(filename) {
    // Clean up the filename
    filename = filename.replace("'", "").replace("?", "");
    currentDownloadingFile = filename;
    console.log("DownloadingFile:", filename);
}

function SetStatusChanged(status) {
    console.log("SetStatusChanged:", status);
    currentStatus = status;
    
    // Update loading percentage based on status
    if (status === "Workshop Complete" || status.indexOf("Workshop Complete") !== -1) {
        allow_increment = false;
        percentage = Math.round(80);
        console.log("Workshop Complete - Percentage:", percentage);
    } else if (status === "Client info sent!" || status.indexOf("Client info sent") !== -1) {
        allow_increment = false;
        percentage = Math.round(95);
        console.log("Client info sent - Percentage:", percentage);
    } else if (status === "Starting Lua..." || status.indexOf("Starting Lua") !== -1) {
        allow_increment = false;
        percentage = Math.round(100);
        console.log("Starting Lua - Percentage:", percentage);
    } else {
        if (allow_increment) {
            percentage = Math.round(percentage + 1);
        }
        console.log("Status update - Percentage:", percentage);
    }
}

/**
 * Test Mode - Simulate file loading for testing
 */
function startTestMode() {
    isTest = true;
    console.log("Starting test mode");

    GameDetails("Test Server", "test.server.com", "gm_construct", "32", "76561198000000000", "sandbox");

    var totalTestFiles = 100;
    SetFilesTotal(totalTestFiles);

    var needed = totalTestFiles;
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
        "lua/weapons/weapon_ak47.lua"
    ];
    
    var testInterval = setInterval(function() {
        if (needed > 0) {
            needed = needed - 1;
            SetFilesNeeded(needed);
            
            // Use realistic filenames
            var fileIndex = (totalTestFiles - needed) % testFiles.length;
            DownloadingFile(testFiles[fileIndex]);
            
            // Add status changes at specific points
            if (needed === 20) {
                SetStatusChanged("Workshop Complete");
                currentDownloadingFile = ""; // Clear file when status changes
            } else if (needed === 5) {
                SetStatusChanged("Client info sent!");
                currentDownloadingFile = ""; // Clear file when status changes
            } else if (needed === 0) {
                SetStatusChanged("Starting Lua...");
                currentDownloadingFile = ""; // Clear file when status changes
                clearInterval(testInterval);
            }
        }
    }, 150);

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

// Subtext rotation system
var subtextMessages = [
    'Join our community at <a href="https://zgrad.gg" target="_blank">zgrad.gg</a>',
    'Follow us on <a href="https://discord.gg/zgrad" target="_blank">Discord</a>',
    'Check out our <a href="https://steam.com/groups/zgrad" target="_blank">Steam Group</a>',
    'Watch gameplay on <a href="https://youtube.com/@zgrad" target="_blank">YouTube</a>',
    'Experience tactical combat like never before',
    'New updates and features added regularly'
];

var currentMessageIndex = 0;
var subtextInterval = null;

/**
 * Initialize UI elements when DOM is ready
 */
function initializeUI() {
    loadingBar = document.getElementById('loadingBar');
    loadingPercentage = document.getElementById('loadingPercentage');
    loadingStatus = document.getElementById('loadingStatus');
    logoSubtext = document.getElementById('logoSubtext');
    
    console.log("UI initialized");
    
    // Start the UI update loop
    updateUI();
    
    // Start subtext rotation
    startSubtextRotation();
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
    
    // If we have a specific status from GMod, use that
    if (currentStatus === "Starting Lua..." || 
        currentStatus === "Client info sent!" || 
        currentStatus === "Workshop Complete") {
        return currentStatus;
    }
    
    // If we're downloading a file, show that
    if (currentDownloadingFile && currentDownloadingFile !== "") {
        // Clean up filename for display
        var displayName = currentDownloadingFile;
        
        // Remove path prefixes
        if (displayName.includes("/")) {
            displayName = displayName.split("/").pop();
        }
        if (displayName.includes("\\")) {
            displayName = displayName.split("\\").pop();
        }
        
        // Truncate very long filenames
        if (displayName.length > 30) {
            displayName = displayName.substring(0, 27) + "...";
        }
        
        return "Downloading: " + displayName;
    }
    
    // Fallback to percentage-based status
    if (percentage >= 100) {
        return "Starting Lua...";
    } else if (percentage >= 95) {
        return "Client info sent!";
    } else if (percentage >= 80) {
        return "Workshop Complete";
    } else if (percentage > 0) {
        return currentStatus || "Loading workshop content...";
    } else {
        return "Initializing...";
    }
}

/**
 * Start the subtext rotation system
 */
function startSubtextRotation() {
    if (!logoSubtext) return;
    
    // Set initial message
    updateSubtextMessage();
    
    // Start rotation interval (change every 8 seconds)
    subtextInterval = setInterval(function() {
        currentMessageIndex = (currentMessageIndex + 1) % subtextMessages.length;
        updateSubtextMessage();
    }, 8000);
}

/**
 * Update the subtext message with fade transition
 */
function updateSubtextMessage() {
    if (!logoSubtext) return;
    
    // Fade out
    logoSubtext.style.opacity = '0';
    
    // Change message after fade out completes
    setTimeout(function() {
        logoSubtext.innerHTML = subtextMessages[currentMessageIndex];
        
        // Fade back in
        logoSubtext.style.opacity = '0.9';
    }, 250); // Half of the CSS transition duration
}

/**
 * Initialize the loading system
 */
document.addEventListener("DOMContentLoaded", function() {
    console.log("Loading system initialized");
    
    // Initialize UI elements
    setTimeout(initializeUI, 100);
    
    // Auto-start test mode if not loaded by GMod after 1 second
    setTimeout(function() {
        if (!isGmod) {
            startTestMode();
        }
    }, 1000);
}); 