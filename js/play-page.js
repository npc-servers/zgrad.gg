/**
 * ZGRAD Play Page - Quick Play Experience
 * Features: Intro splash, welcome popup, tutorial, server list
 */

import { SERVER_GROUPS } from './serverConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // DOM ELEMENTS
    // =========================================
    
    // Splash elements
    const introSplash = document.getElementById('introSplash');
    const splashLogo = document.getElementById('splashLogo');
    
    // Welcome popup elements
    const welcomePopup = document.getElementById('welcomePopup');
    const welcomeChoice = document.getElementById('welcomeChoice');
    const welcomeTutorial = document.getElementById('welcomeTutorial');
    const btnNewPlayer = document.getElementById('btnNewPlayer');
    const btnReturningPlayer = document.getElementById('btnReturningPlayer');
    const btnFinishTutorial = document.getElementById('btnFinishTutorial');
    
    // Server elements
    const quickPlayBtn = document.getElementById('quickPlayBtn');
    const quickPlaySubtitle = document.getElementById('quickPlaySubtitle');
    const serverGrid = document.getElementById('serverGrid');
    const playStatsText = document.getElementById('playStatsText');
    
    // =========================================
    // CONSTANTS & STATE
    // =========================================
    const SPLASH_DURATION = 2200;
    const SPLASH_STORAGE_KEY = 'zgrad_play_splash_shown';
    const STORAGE_KEY = 'zgrad_play_visited';
    
    let splashComplete = false;
    let splashSkipped = false;
    let serverStatuses = [];
    let bestServer = null;
    let quickPlayShuffleInterval = null;
    
    // =========================================
    // WELCOME POPUP FUNCTIONS
    // =========================================
    
    // Check if user has visited before
    function hasVisitedBefore() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    
    // Mark user as visited
    function markAsVisited() {
        localStorage.setItem(STORAGE_KEY, 'true');
    }
    
    // Hide popup
    function hidePopup() {
        if (welcomePopup) {
            welcomePopup.classList.add('hidden');
            document.body.style.overflow = '';
        }
        markAsVisited();
    }
    
    // Show popup
    function showPopup() {
        if (welcomePopup) {
            welcomePopup.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
        if (welcomeChoice) {
            welcomeChoice.style.display = 'flex';
        }
        if (welcomeTutorial) {
            welcomeTutorial.style.display = 'none';
        }
    }
    
    // Update progress bar
    function updateProgress(slideNum) {
        const totalSlides = 4;
        const progressFill = document.getElementById('tutorialProgressFill');
        const progressSteps = document.querySelectorAll('.progress-steps .step');
        
        if (progressFill) {
            progressFill.style.width = `${(slideNum / totalSlides) * 100}%`;
        }
        
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step, 10);
            step.classList.remove('active', 'completed');
            
            if (stepNum < slideNum) {
                step.classList.add('completed');
            } else if (stepNum === slideNum) {
                step.classList.add('active');
            }
        });
    }
    
    // Navigate to slide
    function showSlide(slideNum) {
        if (!welcomeTutorial) return;
        
        const slides = welcomeTutorial.querySelectorAll('.tutorial-slide');
        slides.forEach(slide => {
            const num = parseInt(slide.dataset.slide, 10);
            slide.style.display = num === slideNum ? 'block' : 'none';
        });
        updateProgress(slideNum);
    }
    
    // Show tutorial
    function showTutorial() {
        if (welcomeChoice) {
            welcomeChoice.style.display = 'none';
        }
        if (welcomeTutorial) {
            welcomeTutorial.style.display = 'block';
        }
        showSlide(1);
    }
    
    // Initialize welcome popup (called after splash ends)
    function initWelcomePopup() {
        if (hasVisitedBefore() && welcomePopup) {
            welcomePopup.classList.add('hidden');
            document.body.style.overflow = '';
        } else if (welcomePopup && !welcomePopup.classList.contains('hidden')) {
            // Lock body scroll if welcome popup is visible
            document.body.style.overflow = 'hidden';
        }
    }
    
    // =========================================
    // SPLASH SCREEN FUNCTIONS
    // =========================================
    
    // Check if splash should be shown
    // Skip if user has visited before OR if shown within last 30 minutes
    function shouldShowSplash() {
        // Skip splash entirely if user has already completed the welcome flow
        if (hasVisitedBefore()) return false;
        
        // Also skip if splash was shown recently (within 30 minutes) for fresh sessions
        const lastShown = localStorage.getItem(SPLASH_STORAGE_KEY);
        if (!lastShown) return true;
        
        const thirtyMinutes = 30 * 60 * 1000;
        return (Date.now() - parseInt(lastShown, 10)) > thirtyMinutes;
    }
    
    // Mark splash as shown
    function markSplashShown() {
        localStorage.setItem(SPLASH_STORAGE_KEY, Date.now().toString());
    }
    
    // End splash screen
    function endSplash(callback) {
        if (splashComplete) return;
        splashComplete = true;
        
        if (introSplash) {
            introSplash.classList.add('fade-out');
            
            setTimeout(() => {
                introSplash.classList.add('hidden');
                markSplashShown();
                if (callback) callback();
            }, 800);
        } else if (callback) {
            callback();
        }
    }
    
    // Skip splash on interaction
    function skipSplash() {
        if (splashSkipped || splashComplete) return;
        splashSkipped = true;
        endSplash(initWelcomePopup);
    }
    
    // Initialize splash
    function initSplash() {
        if (!shouldShowSplash() || !introSplash) {
            // Skip splash entirely
            if (introSplash) {
                introSplash.classList.add('hidden');
            }
            splashComplete = true;
            initWelcomePopup();
            return;
        }
        
        // Auto-end splash after duration
        setTimeout(() => {
            if (!splashComplete) {
                endSplash(initWelcomePopup);
            }
        }, SPLASH_DURATION);
        
        // Skip on click
        introSplash.addEventListener('click', skipSplash);
        
        // Skip on any key
        document.addEventListener('keydown', function splashKeyHandler(e) {
            skipSplash();
            document.removeEventListener('keydown', splashKeyHandler);
        }, { once: true });
    }
    
    // =========================================
    // SERVER LIST FUNCTIONS
    // =========================================
    
    // Detect user's region based on timezone - prioritize EU for European users
    function detectUserRegion() {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // European, African, Middle Eastern, and Western Asian timezones -> EU servers
            const euTimezones = [
                'Europe/',      // All of Europe
                'Africa/',      // Africa (closer to EU servers)
                'Atlantic/',    // Atlantic islands
                'Arctic/',      // Arctic regions
                'Asia/Istanbul', 'Asia/Nicosia', 'Asia/Beirut', 'Asia/Damascus',
                'Asia/Jerusalem', 'Asia/Tel_Aviv', 'Asia/Amman', 'Asia/Baghdad',
                'Asia/Kuwait', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Muscat',
                'Asia/Bahrain', 'Asia/Qatar', 'Indian/'
            ];
            
            const isEurope = euTimezones.some(tz => timezone.startsWith(tz));
            return isEurope ? 'EU' : 'US';
        } catch (e) {
            return 'US';
        }
    }
    
    const userRegion = detectUserRegion();
    console.log(`Detected region: ${userRegion}`);
    
    // Fetch server status
    function fetchServerStatus(server) {
        return fetch(`https://gameserveranalytics.com/api/v2/query?game=source&ip=${server.ip}&port=${server.port}&type=info`)
            .then(response => response.json())
            .then(serverInfo => {
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
            })
            .catch(error => {
                console.error(`Error fetching data for ${server.id}:`, error);
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
    
    // Select a random server that isn't full or empty
    function selectBestServer(statuses) {
        const onlineServers = statuses.filter(s => s.online);
        
        if (onlineServers.length === 0) {
            return null;
        }
        
        // Filter out full servers (95%+ capacity) and dead/empty servers (0 players)
        const validServers = onlineServers.filter(s => {
            const fillRatio = s.maxPlayers > 0 ? s.players / s.maxPlayers : 0;
            const isFull = fillRatio >= 0.95;
            const isDead = s.players === 0;
            return !isFull && !isDead;
        });
        
        // If no valid servers, fall back to any online server that isn't completely full
        const candidatePool = validServers.length > 0 
            ? validServers 
            : onlineServers.filter(s => s.players < s.maxPlayers);
        
        if (candidatePool.length === 0) {
            return null;
        }
        
        // Prefer servers in user's region if available
        const regionServers = candidatePool.filter(s => s.server.region === userRegion);
        const finalPool = regionServers.length > 0 ? regionServers : candidatePool;
        
        // Pure random selection
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    }
    
    // Select a random server excluding a specific one
    function selectRandomServerExcluding(statuses, excludeId) {
        const onlineServers = statuses.filter(s => s.online);
        
        if (onlineServers.length === 0) {
            return null;
        }
        
        // Filter out full servers and dead servers, plus the excluded one
        const validServers = onlineServers.filter(s => {
            const fillRatio = s.maxPlayers > 0 ? s.players / s.maxPlayers : 0;
            const isFull = fillRatio >= 0.95;
            const isDead = s.players === 0;
            const isExcluded = excludeId && s.server.id === excludeId;
            return !isFull && !isDead && !isExcluded;
        });
        
        // If only one valid server or none after excluding, include the excluded one
        if (validServers.length === 0) {
            return selectBestServer(statuses);
        }
        
        // Prefer servers in user's region if available
        const regionServers = validServers.filter(s => s.server.region === userRegion);
        const finalPool = regionServers.length > 0 ? regionServers : validServers;
        
        // Pure random selection
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    }
    
    // Shuffle quick play to a new random server with animation
    function shuffleQuickPlay() {
        if (serverStatuses.length === 0 || !quickPlaySubtitle) return;
        
        // Get a new server, excluding the current one
        const currentId = bestServer ? bestServer.server.id : null;
        const newServer = selectRandomServerExcluding(serverStatuses, currentId);
        
        // Don't update if no new server or if it's the same server
        if (!newServer || (bestServer && newServer.server.id === bestServer.server.id)) return;
        
        bestServer = newServer;
        
        // Animate the text change
        quickPlaySubtitle.classList.add('shuffling-out');
        
        setTimeout(() => {
            quickPlaySubtitle.textContent = `Join ${bestServer.server.title} (${bestServer.players} players)`;
            quickPlaySubtitle.classList.remove('shuffling-out');
            quickPlaySubtitle.classList.add('shuffling-in');
            
            setTimeout(() => {
                quickPlaySubtitle.classList.remove('shuffling-in');
            }, 300);
        }, 200);
    }
    
    // Start the quick play shuffle interval
    function startQuickPlayShuffle() {
        if (quickPlayShuffleInterval) {
            clearInterval(quickPlayShuffleInterval);
        }
        quickPlayShuffleInterval = setInterval(shuffleQuickPlay, 10000);
    }
    
    // Create server card HTML
    function createServerCard(status) {
        const server = status.server;
        const isOnline = status.online;
        const playerCount = status.players;
        const maxPlayers = status.maxPlayers;
        const fillRatio = maxPlayers > 0 ? playerCount / maxPlayers : 0;
        
        const card = document.createElement('a');
        card.className = `server-card ${isOnline ? 'online' : 'offline'}`;
        card.href = isOnline ? `https://zgrad.gg/${server.link}` : '#';
        if (!isOnline) {
            card.onclick = (e) => e.preventDefault();
        }
        
        let playersClass = '';
        if (fillRatio >= 0.95) playersClass = 'full';
        else if (fillRatio >= 0.8) playersClass = 'high';
        
        // SVG flags instead of emoji for better compatibility
        const usFlag = `<svg class="flag-icon" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><path fill="#B22234" d="M35.445 7C34.752 5.809 33.477 5 32 5H18v2h17.445zM0 25h36v2H0zm18-8h18v2H18zm0-4h18v2H18zM0 21h36v2H0zm4 10h28c1.477 0 2.752-.809 3.445-2H.555c.693 1.191 1.968 2 3.445 2zM18 9h18v2H18z"/><path fill="#EEE" d="M.068 27.679c.017.093.036.186.059.277.026.101.058.198.092.296.089.259.197.509.328.743L.555 29h34.89l.008-.005c.13-.234.238-.484.328-.743.034-.098.066-.196.092-.296.023-.091.042-.184.059-.277.041-.22.068-.446.068-.679H0c0 .233.027.459.068.679zM0 23h36v2H0zm0-4v2h36v-2H18zm18-4h18v2H18zm0-4h18v2H18zM0 9c0-.233.027-.457.068-.679C.028 8.543.009 8.77 0 9zm.555-2l-.003.005L.555 7zM.128 8.044c.025-.102.055-.2.089-.3a3.56 3.56 0 0 1 .109-.282C.167 7.75.156 8.034.128 8.044zM18 7h17.445C34.752 5.809 33.477 5 32 5H18v2z"/><path fill="#3C3B6E" d="M18 5H4C1.791 5 0 6.791 0 9v10h18V5z"/><path fill="#FFF" d="M2.001 7.726l.618.449-.236.725L3 8.452l.618.448-.236-.725L4 7.726h-.764L3 7l-.235.726zm2 2l.618.449-.236.725.617-.448.618.448-.236-.725L6 9.726h-.764L5 9l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L9 9l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L13 9l-.235.726zm-8 4l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L5 13l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L9 13l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L13 13l-.235.726zm-6-6l.618.449-.236.725L7 8.452l.618.448-.236-.725L8 7.726h-.764L7 7l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L11 7l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L15 7l-.235.726zm-12 4l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L3 11l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L7 11l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L11 11l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L15 11l-.235.726zm-12 4l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L3 15l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L7 15l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L11 15l-.235.726zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L15 15l-.235.726zm-12 4l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L3 19l-.235.726h-.764zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L7 19l-.235.726h-.764zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L11 19l-.235.726h-.764zm4 0l.618.449-.236.725.617-.448.618.448-.236-.725.618-.449h-.764L15 19l-.235.726h-.764z"/></svg>`;
        const euFlag = `<svg class="flag-icon" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><path fill="#039" d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z"/><path fill="#FC0" d="M18 8l.5 1.5H20l-1.25 1 .5 1.5L18 11l-1.25 1 .5-1.5-1.25-1h1.5zm0 18l.5 1.5H20l-1.25 1 .5 1.5L18 29l-1.25 1 .5-1.5-1.25-1h1.5zM10 12l.5 1.5H12l-1.25 1 .5 1.5L10 15l-1.25 1 .5-1.5-1.25-1h1.5zm16 0l.5 1.5H28l-1.25 1 .5 1.5L26 15l-1.25 1 .5-1.5-1.25-1h1.5zM7 18l.5 1.5H9l-1.25 1 .5 1.5L7 21l-1.25 1 .5-1.5-1.25-1h1.5zm22 0l.5 1.5H31l-1.25 1 .5 1.5L29 21l-1.25 1 .5-1.5-1.25-1h1.5zM10 24l.5 1.5H12l-1.25 1 .5 1.5L10 27l-1.25 1 .5-1.5-1.25-1h1.5zm16 0l.5 1.5H28l-1.25 1 .5 1.5L26 27l-1.25 1 .5-1.5-1.25-1h1.5z"/></svg>`;
        const regionFlag = server.region === 'US' ? usFlag : euFlag;
        
        card.innerHTML = `
            <div class="server-info">
                <div class="server-header">
                    <span class="region-flag">${regionFlag}</span>
                    <h3 class="server-name">${server.title}</h3>
                </div>
                <p class="server-meta">${status.gamemode}</p>
            </div>
            <div class="server-players ${playersClass}">
                ${isOnline ? `<span class="count">${playerCount}</span><span class="max">/${maxPlayers}</span>` : '<span class="offline-text">Offline</span>'}
            </div>
            <svg class="server-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
        `;
        
        return card;
    }
    
    // Update the UI with server data
    function updateUI(statuses) {
        serverStatuses = statuses;
        
        const totalPlayers = statuses.reduce((sum, s) => sum + s.players, 0);
        const onlineCount = statuses.filter(s => s.online).length;
        
        if (playStatsText) {
            playStatsText.className = 'total-playercount-text online';
            playStatsText.innerHTML = `<span class="current-count">${totalPlayers}</span> players online across ${onlineCount} servers`;
        }
        
        bestServer = selectBestServer(statuses);
        
        if (quickPlayBtn) {
            if (bestServer) {
                quickPlayBtn.disabled = false;
                if (quickPlaySubtitle) {
                    quickPlaySubtitle.textContent = `Join ${bestServer.server.title} (${bestServer.players} players)`;
                }
            } else {
                quickPlayBtn.disabled = true;
                if (quickPlaySubtitle) {
                    quickPlaySubtitle.textContent = 'No servers available';
                }
            }
        }
        
        const sortedStatuses = [...statuses].sort((a, b) => {
            if (a.online && !b.online) return -1;
            if (!a.online && b.online) return 1;
            
            if (a.server.region === userRegion && b.server.region !== userRegion) return -1;
            if (a.server.region !== userRegion && b.server.region === userRegion) return 1;
            
            return b.players - a.players;
        });
        
        if (serverGrid) {
            serverGrid.innerHTML = '';
            sortedStatuses.forEach(status => {
                const card = createServerCard(status);
                serverGrid.appendChild(card);
            });
        }
    }
    
    // Load servers
    function loadServers() {
        return Promise.all(SERVER_GROUPS.map(server => fetchServerStatus(server)))
            .then(statuses => {
                updateUI(statuses);
                startQuickPlayShuffle();
            })
            .catch(error => {
                console.error('Error loading servers:', error);
                if (serverGrid) {
                    serverGrid.innerHTML = `
                        <div class="server-loading" style="color: #f44336;">
                            <span>Error loading servers. Please refresh.</span>
                        </div>
                    `;
                }
                if (quickPlayBtn) {
                    quickPlayBtn.disabled = true;
                }
                if (quickPlaySubtitle) {
                    quickPlaySubtitle.textContent = 'Error loading servers';
                }
            });
    }
    
    // =========================================
    // EVENT LISTENERS
    // =========================================
    
    // Welcome popup buttons
    if (btnNewPlayer) {
        btnNewPlayer.addEventListener('click', showTutorial);
    }
    
    if (btnReturningPlayer) {
        btnReturningPlayer.addEventListener('click', hidePopup);
    }
    
    if (btnFinishTutorial) {
        btnFinishTutorial.addEventListener('click', hidePopup);
    }
    
    // Tutorial navigation buttons
    if (welcomeTutorial) {
        welcomeTutorial.querySelectorAll('.nav-btn-next').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextSlide = parseInt(btn.dataset.next, 10);
                showSlide(nextSlide);
            });
        });
        
        welcomeTutorial.querySelectorAll('.nav-btn-back').forEach(btn => {
            btn.addEventListener('click', () => {
                const prevSlide = parseInt(btn.dataset.prev, 10);
                showSlide(prevSlide);
            });
        });
    }
    
    // ESC key to skip welcome screen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && welcomePopup && !welcomePopup.classList.contains('hidden')) {
            hidePopup();
        }
    });
    
    // Quick play button handler
    if (quickPlayBtn) {
        quickPlayBtn.addEventListener('click', () => {
            if (bestServer) {
                window.location.href = `https://zgrad.gg/${bestServer.server.link}`;
            }
        });
    }
    
    // Keyboard shortcut for quick play (Enter key when popup is hidden)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && welcomePopup?.classList.contains('hidden') && !quickPlayBtn?.disabled) {
            quickPlayBtn?.click();
        }
    });
    
    // =========================================
    // JOIN GUIDE POPUP
    // =========================================
    
    const joinGuidePopup = document.getElementById('joinGuidePopup');
    const btnJoinGuide = document.getElementById('btnJoinGuide');
    const popupClose = document.getElementById('popupClose');
    const popupBackdrop = document.getElementById('popupBackdrop');
    
    function showJoinGuide() {
        if (joinGuidePopup) {
            joinGuidePopup.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideJoinGuide() {
        if (joinGuidePopup) {
            joinGuidePopup.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    if (btnJoinGuide) {
        btnJoinGuide.addEventListener('click', showJoinGuide);
    }
    
    if (popupClose) {
        popupClose.addEventListener('click', hideJoinGuide);
    }
    
    if (popupBackdrop) {
        popupBackdrop.addEventListener('click', hideJoinGuide);
    }
    
    // ESC key to close join guide popup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && joinGuidePopup?.classList.contains('show')) {
            hideJoinGuide();
        }
    });
    
    // =========================================
    // BACKGROUND PARALLAX EFFECT (desktop only)
    // =========================================
    
    const bgImage = document.querySelector('.play-bg-image');
    const isMobile = window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
    
    if (bgImage && !isMobile) {
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        
        // Maximum movement in pixels
        const maxMove = 20;
        
        document.addEventListener('mousemove', (e) => {
            // Calculate mouse position relative to center (0-1 range, centered at 0.5)
            const xPercent = e.clientX / window.innerWidth;
            const yPercent = e.clientY / window.innerHeight;
            
            // Convert to -1 to 1 range (centered at 0)
            targetX = (xPercent - 0.5) * 2 * maxMove;
            targetY = (yPercent - 0.5) * 2 * maxMove;
        });
        
        // Smooth animation loop
        function animateBackground() {
            // Lerp (linear interpolation) for smooth movement
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;
            
            bgImage.style.transform = `scale(1.1) translate(${-currentX}px, ${-currentY}px)`;
            
            requestAnimationFrame(animateBackground);
        }
        
        animateBackground();
    }
    
    // =========================================
    // INITIALIZATION
    // =========================================
    
    // Start splash screen
    initSplash();
    
    // Load servers
    loadServers();
    
    // Refresh servers every 30 seconds
    setInterval(loadServers, 30000);
    
    console.log('ZGRAD Play page initialized');
});
