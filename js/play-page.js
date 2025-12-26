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
    const btnShowTutorial = document.getElementById('btnShowTutorial');
    
    // Server elements
    const quickPlayBtn = document.getElementById('quickPlayBtn');
    const quickPlaySubtitle = document.getElementById('quickPlaySubtitle');
    const serverGrid = document.getElementById('serverGrid');
    const totalPlayersEl = document.getElementById('totalPlayers');
    const totalServersEl = document.getElementById('totalServers');
    
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
        }
        markAsVisited();
    }
    
    // Show popup
    function showPopup() {
        if (welcomePopup) {
            welcomePopup.classList.remove('hidden');
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
        }
    }
    
    // =========================================
    // SPLASH SCREEN FUNCTIONS
    // =========================================
    
    // Check if splash was shown recently (within 30 minutes)
    function shouldShowSplash() {
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
    
    // Detect user's region based on timezone
    function detectUserRegion() {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const europeTimezones = ['Europe/', 'Africa/', 'Atlantic/', 'Arctic/'];
            const isEurope = europeTimezones.some(tz => timezone.startsWith(tz));
            return isEurope ? 'EU' : 'US';
        } catch (e) {
            return 'US';
        }
    }
    
    const userRegion = detectUserRegion();
    
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
    
    // Select best server based on region and player count
    function selectBestServer(statuses) {
        const onlineServers = statuses.filter(s => s.online);
        
        if (onlineServers.length === 0) {
            return null;
        }
        
        const regionServers = onlineServers.filter(s => s.server.region === userRegion);
        const candidateServers = regionServers.length > 0 ? regionServers : onlineServers;
        
        const scoredServers = candidateServers.map(s => {
            let score = 0;
            const fillRatio = s.maxPlayers > 0 ? s.players / s.maxPlayers : 0;
            
            if (s.players > 0 && s.players < 5) score += 10;
            else if (s.players >= 5 && s.players < 15) score += 30;
            else if (s.players >= 15 && s.players < 25) score += 50;
            else if (s.players >= 25) score += 40;
            
            if (fillRatio >= 0.95) score -= 50;
            else if (fillRatio >= 0.9) score -= 20;
            else if (fillRatio >= 0.8) score -= 5;
            
            if (s.server.region === userRegion) score += 20;
            
            return { ...s, score };
        });
        
        scoredServers.sort((a, b) => b.score - a.score);
        
        return scoredServers[0];
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
        card.href = isOnline ? `/${server.link}` : '#';
        if (!isOnline) {
            card.onclick = (e) => e.preventDefault();
        }
        
        let playersClass = '';
        if (fillRatio >= 0.95) playersClass = 'full';
        else if (fillRatio >= 0.8) playersClass = 'high';
        
        const regionFlag = server.region === 'US' ? '🇺🇸' : '🇪🇺';
        
        card.innerHTML = `
            <div class="server-status ${isOnline ? 'online' : 'offline'}"></div>
            <div class="server-info">
                <h3 class="server-name">${server.title} <span class="region-flag">${regionFlag}</span></h3>
                <p class="server-meta">${status.gamemode}</p>
            </div>
            <div class="server-players ${playersClass}">
                ${isOnline ? `<span class="count">${playerCount}</span>/${maxPlayers}` : 'Offline'}
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
        
        if (totalPlayersEl) totalPlayersEl.textContent = totalPlayers;
        if (totalServersEl) totalServersEl.textContent = `${onlineCount}/${statuses.length}`;
        
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
    
    if (btnShowTutorial) {
        btnShowTutorial.addEventListener('click', showPopup);
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
                window.location.href = `/${bestServer.server.link}`;
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
