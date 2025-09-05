document.addEventListener('DOMContentLoaded', () => {
    const serverList = document.getElementById('serverList');
    let serverElements = new Map(); // Track existing server elements
    
    // Server configuration - same as landing-section.js
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
            port: 27050,
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
                    gamemode: server.gamemode,
                    server: server
                };

                if (serverInfo && (serverInfo.status?.toLowerCase() === 'online' || serverInfo.players !== undefined)) {
                    status.online = true;
                    status.players = serverInfo.players || serverInfo.num_players || serverInfo.playercount || 0;
                    status.maxPlayers = serverInfo.maxplayers || serverInfo.max_players || serverInfo.maxclients || 32;
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
                    maxPlayers: 32, 
                    map: 'Unknown',
                    gamemode: server.gamemode,
                    server: server 
                };
            });
    };
    
    // Function to create server item HTML
    const createServerItem = (serverStatus) => {
        const server = serverStatus.server;
        const isOnline = serverStatus.online;
        const playerCount = serverStatus.players;
        const maxPlayers = serverStatus.maxPlayers;
        const playerPercentage = maxPlayers > 0 ? (playerCount / maxPlayers) * 100 : 0;
        
        // Determine player count color classes and server capacity classes
        let playerCountClass = '';
        let serverCapacityClass = '';
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
        
        const wrapper = document.createElement('div');
        wrapper.className = 'server-wrapper';
        
        // Create different HTML based on server status
        if (isOnline) {
            wrapper.innerHTML = `
                <div class="server-item ${serverCapacityClass}" data-server-id="${server.id}">
                    <div class="server-content">
                        <div class="server-info">
                            <div class="server-name-display">${server.title}</div>
                            <div class="server-players-display">// <span class="${playerCountClass}">${playerCount}/${maxPlayers}</span> players online</div>
                            <div class="server-gamemode-display">Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}</div>
                        </div>
                    </div>
                </div>
                <a href="${server.link}" class="server-join-btn">JOIN</a>
            `;
        } else {
            wrapper.innerHTML = `
                <div class="server-item ${serverCapacityClass}" data-server-id="${server.id}">
                    <div class="server-content">
                        <div class="server-info">
                            <div class="server-name-display">${server.title}</div>
                            <div class="server-offline-message">This server is down, we may be experiencing an outage or crashed :(</div>
                        </div>
                    </div>
                </div>
                <a href="${server.link}" class="server-join-btn" style="pointer-events: none;">OFFLINE</a>
            `;
        }
        
        return wrapper;
    };

    // Function to update individual server element
    const updateServerElement = (wrapper, serverStatus) => {
        const server = serverStatus.server;
        const isOnline = serverStatus.online;
        const playerCount = serverStatus.players;
        const maxPlayers = serverStatus.maxPlayers;
        const playerPercentage = maxPlayers > 0 ? (playerCount / maxPlayers) * 100 : 0;
        
        // Determine player count color classes and server capacity classes
        let playerCountClass = '';
        let serverCapacityClass = '';
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

        // Update server item classes
        const serverItem = wrapper.querySelector('.server-item');
        serverItem.className = `server-item ${serverCapacityClass}`;
        
        // Update server info based on status
        const serverInfo = wrapper.querySelector('.server-info');
        
        if (isOnline) {
            // Update for online server
            serverInfo.innerHTML = `
                <div class="server-name-display">${server.title}</div>
                <div class="server-players-display">// <span class="${playerCountClass}">${playerCount}/${maxPlayers}</span> players online</div>
                <div class="server-gamemode-display">Now Playing: <span>${serverStatus.gamemode}</span> <span style="color: #a8a8a8;">on</span> ${serverStatus.map}</div>
            `;
        } else {
            // Update for offline server
            serverInfo.innerHTML = `
                <div class="server-name-display">${server.title}</div>
                <div class="server-offline-message">This server is down, we may be experiencing an outage or crashed :(</div>
            `;
        }
        
        // Update join button
        const joinBtn = wrapper.querySelector('.server-join-btn');
        joinBtn.textContent = isOnline ? 'JOIN' : 'OFFLINE';
        if (!isOnline) {
            joinBtn.style.pointerEvents = 'none';
        } else {
            joinBtn.style.pointerEvents = '';
        }
    };
    
    // Function to update server list
    const updateServerList = () => {
        // If no servers exist yet, show loading
        if (serverElements.size === 0) {
            serverList.innerHTML = '<div class="server-loading">Loading servers...</div>';
        }
        
        // Fetch status for all servers
        Promise.all(servers.map(server => fetchServerStatus(server)))
            .then(statuses => {
                // Calculate total player count
                const totalPlayers = statuses.reduce((sum, status) => sum + status.players, 0);
                const totalMaxPlayers = statuses.reduce((sum, status) => sum + status.maxPlayers, 0);
                const onlineServers = statuses.filter(status => status.online).length;
                
                // Update total playercount display
                const totalPlayercountText = document.querySelector('.total-playercount-text');
                if (totalPlayercountText) {
                    totalPlayercountText.className = 'total-playercount-text online';
                    totalPlayercountText.innerHTML = `<span class="current-count">${totalPlayers}</span>/${totalMaxPlayers} total players online across ${onlineServers} servers`;
                }
                
                // Sort servers by player count (highest first)
                statuses.sort((a, b) => {
                    // Online servers first
                    if (a.online && !b.online) return -1;
                    if (!a.online && b.online) return 1;
                    // Then by player count
                    return b.players - a.players;
                });
                
                // Clear loading message only on first load
                if (serverElements.size === 0) {
                    serverList.innerHTML = '';
                }
                
                // Update or create server elements
                statuses.forEach((serverStatus, index) => {
                    const serverId = serverStatus.server.id;
                    let wrapper = serverElements.get(serverId);
                    
                    if (!wrapper) {
                        // Create new server element
                        wrapper = createServerItem(serverStatus);
                        serverElements.set(serverId, wrapper);
                        serverList.appendChild(wrapper);
                    } else {
                        // Update existing server element
                        updateServerElement(wrapper, serverStatus);
                    }
                    
                    // Ensure correct order
                    const currentIndex = Array.from(serverList.children).indexOf(wrapper);
                    if (currentIndex !== index) {
                        if (index === 0) {
                            serverList.insertBefore(wrapper, serverList.firstChild);
                        } else {
                            const beforeElement = serverList.children[index];
                            if (beforeElement) {
                                serverList.insertBefore(wrapper, beforeElement);
                            } else {
                                serverList.appendChild(wrapper);
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error("Error updating server list:", error);
                
                // Update total playercount display with error state
                const totalPlayercountText = document.querySelector('.total-playercount-text');
                if (totalPlayercountText) {
                    totalPlayercountText.className = 'total-playercount-text offline';
                    totalPlayercountText.textContent = 'Error loading player count';
                }
                
                if (serverElements.size === 0) {
                    serverList.innerHTML = `
                        <div class="server-loading" style="color: #f44336;">
                            Error loading servers. Please try again later.
                        </div>
                    `;
                }
            });
    };
    
    // Update server list immediately and then every 30 seconds
    updateServerList();
    setInterval(updateServerList, 30000);
    
    // Hosting Notification Functionality
    const initHostingNotification = () => {
        const notification = document.getElementById('hostingNotification');
        const notificationHeader = document.getElementById('notificationHeader');
        
        if (!notification || !notificationHeader) return;
        
        // Show notification after 2 seconds
        setTimeout(() => {
            notification.classList.add('show');
            
            // Track that notification has been shown
            localStorage.setItem('hostingNotificationSeen', 'true');
        }, 2000);
        
        // Handle notification header click (expand/collapse)
        notificationHeader.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = notification.classList.contains('expanded');
            
            if (isExpanded) {
                notification.classList.remove('expanded');
            } else {
                notification.classList.add('expanded');
            }
            
            // Track user interaction
            localStorage.setItem('hostingNotificationInteracted', 'true');
        });
        
        // Handle affiliate button click tracking
        const affiliateBtn = notification.querySelector('.affiliate-btn');
        if (affiliateBtn) {
            affiliateBtn.addEventListener('click', (e) => {
                // Track affiliate button click
                localStorage.setItem('hostingNotificationClicked', 'true');
                
                // Optional: You can add analytics tracking here
            });
        }
        
        // Handle copy code functionality
        const copyCodeElement = notification.querySelector('.copy-code');
        if (copyCodeElement) {
            copyCodeElement.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const codeText = copyCodeElement.getAttribute('data-code');
                
                try {
                    // Use modern clipboard API if available
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(codeText);
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = codeText;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        textArea.style.left = '-9999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                    
                    // Visual feedback
                    copyCodeElement.classList.add('copied');
                    const originalText = copyCodeElement.textContent;
                    copyCodeElement.textContent = 'COPIED!';
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        copyCodeElement.classList.remove('copied');
                        copyCodeElement.textContent = originalText;
                    }, 2000);
                    
                    // Track copy action
                    localStorage.setItem('hostingNotificationCodeCopied', 'true');
                    
                } catch (err) {
                    console.error('Failed to copy code:', err);
                    
                    // Fallback visual feedback for copy failure
                    copyCodeElement.style.background = 'rgba(244, 67, 54, 0.3)';
                    copyCodeElement.style.borderColor = 'rgba(244, 67, 54, 0.6)';
                    const originalText = copyCodeElement.textContent;
                    copyCodeElement.textContent = 'FAILED';
                    
                    setTimeout(() => {
                        copyCodeElement.style.background = '';
                        copyCodeElement.style.borderColor = '';
                        copyCodeElement.textContent = originalText;
                    }, 2000);
                }
            });
        }
        
        // Add close functionality (optional - click outside to dismiss)
        document.addEventListener('click', (e) => {
            if (notification.classList.contains('show') && 
                !notification.contains(e.target) && 
                notification.classList.contains('expanded')) {
                
                notification.classList.remove('expanded');
                
                // If user clicks outside after expanding, consider it as "dismissed"
                setTimeout(() => {
                    if (!notification.classList.contains('expanded')) {
                        localStorage.setItem('hostingNotificationDismissed', Date.now().toString());
                    }
                }, 300);
            }
        });
        
        // Auto-hide functionality removed for testing
    };
    
    // Initialize notification system
    initHostingNotification();
    
    // Mobile Affiliate Ad Functionality
    const initMobileAffiliateAd = () => {
        const mobileAd = document.getElementById('mobileAffiliateAd');
        if (!mobileAd) return;
        
        // Show mobile ad after servers are loaded (add a small delay)
        setTimeout(() => {
            mobileAd.style.opacity = '1';
            mobileAd.style.transform = 'translateY(0)';
            
            // Track that mobile ad has been shown
            localStorage.setItem('mobileAffiliateAdSeen', 'true');
        }, 3000);
        
        // Handle mobile affiliate button click tracking
        const mobileAffiliateBtn = mobileAd.querySelector('.mobile-cta-btn');
        if (mobileAffiliateBtn) {
            mobileAffiliateBtn.addEventListener('click', (e) => {
                // Track mobile affiliate button click
                localStorage.setItem('mobileAffiliateAdClicked', 'true');
                
                // Optional: You can add analytics tracking here
            });
        }
        
        // Handle mobile copy code functionality
        const mobileCopyCodeElement = mobileAd.querySelector('.mobile-copy-code');
        if (mobileCopyCodeElement) {
            mobileCopyCodeElement.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const codeText = mobileCopyCodeElement.getAttribute('data-code');
                
                try {
                    // Use modern clipboard API if available
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(codeText);
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = codeText;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        textArea.style.left = '-9999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                    
                    // Visual feedback
                    mobileCopyCodeElement.classList.add('copied');
                    const originalText = mobileCopyCodeElement.textContent;
                    mobileCopyCodeElement.textContent = 'COPIED!';
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        mobileCopyCodeElement.classList.remove('copied');
                        mobileCopyCodeElement.textContent = originalText;
                    }, 2000);
                    
                    // Track copy action
                    localStorage.setItem('mobileAffiliateCodeCopied', 'true');
                    
                } catch (err) {
                    console.error('Failed to copy mobile code:', err);
                    
                    // Fallback visual feedback for copy failure
                    mobileCopyCodeElement.style.background = 'rgba(244, 67, 54, 0.3)';
                    mobileCopyCodeElement.style.borderColor = 'rgba(244, 67, 54, 0.6)';
                    const originalText = mobileCopyCodeElement.textContent;
                    mobileCopyCodeElement.textContent = 'FAILED';
                    
                    setTimeout(() => {
                        mobileCopyCodeElement.style.background = '';
                        mobileCopyCodeElement.style.borderColor = '';
                        mobileCopyCodeElement.textContent = originalText;
                    }, 2000);
                }
            });
        }
    };
    
    // Initialize mobile affiliate ad system
    initMobileAffiliateAd();
    
    // Join Guide Popup Functionality
    const initJoinGuidePopup = () => {
        const guideBtn = document.querySelector('.guide-btn');
        const popup = document.getElementById('joinGuidePopup');
        const popupClose = document.getElementById('popupClose');
        const popupBackdrop = document.getElementById('popupBackdrop');
        
        if (!guideBtn || !popup || !popupClose || !popupBackdrop) return;
        
        // Open popup when guide button is clicked
        guideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Track popup opened
            localStorage.setItem('joinGuidePopupOpened', 'true');
        });
        
        // Close popup when close button is clicked
        popupClose.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.remove('show');
            document.body.style.overflow = ''; // Restore background scrolling
            
            // Track popup closed
            localStorage.setItem('joinGuidePopupClosed', 'true');
        });
        
        // Close popup when backdrop is clicked
        popupBackdrop.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.remove('show');
            document.body.style.overflow = ''; // Restore background scrolling
            
            // Track popup closed via backdrop
            localStorage.setItem('joinGuidePopupClosedViaBackdrop', 'true');
        });
        
        // Close popup when Escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup.classList.contains('show')) {
                popup.classList.remove('show');
                document.body.style.overflow = ''; // Restore background scrolling
                
                // Track popup closed via escape key
                localStorage.setItem('joinGuidePopupClosedViaEscape', 'true');
            }
        });
        
        // Prevent popup content clicks from closing the popup
        const popupContent = popup.querySelector('.popup-content');
        if (popupContent) {
            popupContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    };
    
    // Initialize join guide popup system
    initJoinGuidePopup();
    
    // Initialize bloodsplatter animation
    initBloodsplatterAnimation();
});

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Bloodsplatter Animation System for Servers Page
function initBloodsplatterAnimation() {
    const serverTitleSplatter = document.querySelector('.server-title-splatter');
    if (!serverTitleSplatter) return;
    
    const img = serverTitleSplatter.querySelector('img');
    if (!img) return;
    
    // Configuration for server title splatter
    const config = {
        centerX: 5, // Far left edge
        centerY: 15, // Upper edge
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out"
    };
    
    // Create the reveal animation timeline
    const tl = gsap.timeline({
        paused: true
    });
    
    // Get unique seed for this splatter
    const seed = getSplatterSeed('server-title-splatter');
    
    // Paths will be lazily calculated when animation starts
    
    // Initial state - completely hidden with noise pattern
    const initialPath = getPreCalculatedServerPath(0, config.centerX, config.centerY, seed);
    gsap.set(img, {
        clipPath: initialPath
    });
    
    // Create the main splatter reveal animation with pre-calculated paths
    tl.to(img, {
        duration: config.duration,
        ease: config.ease,
        onUpdate: function() {
            // Use pre-calculated paths for much better performance
            const progress = this.progress();
            const maxProgress = 150; // Go well beyond 100% to ensure full PNG reveal
            
            // Add subtle pulsing to make it more dynamic
            const pulse = Math.sin(progress * Math.PI * 1.2) * 2;
            const adjustedProgress = Math.min(maxProgress, Math.max(0, (progress * maxProgress) + pulse));
            
            // Use pre-calculated path lookup instead of real-time generation
            const noisyPath = getPreCalculatedServerPath(adjustedProgress, config.centerX, config.centerY, seed);
            img.style.clipPath = noisyPath;
        }
    });
    
    // Create ScrollTrigger for the splatter - trigger immediately when page loads
    ScrollTrigger.create({
        trigger: serverTitleSplatter,
        start: "top 95%",
        markers: false,
        onEnter: () => {
            // Add delay and play animation
            gsap.delayedCall(config.delay, () => {
                tl.play();
                serverTitleSplatter.classList.add('bloodsplatter-revealed');
            });
        },
        id: 'server-title-splatter'
    });
    
    // Also trigger immediately on page load (for users already at top)
    gsap.delayedCall(config.delay + 0.5, () => {
        if (!serverTitleSplatter.classList.contains('bloodsplatter-revealed')) {
            tl.play();
            serverTitleSplatter.classList.add('bloodsplatter-revealed');
        }
    });
}

// Advanced noise-based splatter edge generator with smooth curves
function createNoisyRevealPath(progress, centerX, centerY, seed = 0) {
    const points = 48; // Many points for smooth curves
    const baseRadius = progress;
    const maxVariation = 0.35; // Reduced chaos for smoother edges
    let path = 'polygon(';
    
    // Improved noise function with multiple octaves for smoother variation
    function smoothNoise(x, offset = 0) {
        // Primary wave (large features)
        const wave1 = Math.sin(x * 2.5 + offset + seed) * 0.6;
        // Secondary wave (medium features)  
        const wave2 = Math.sin(x * 5.2 + offset * 1.7 + seed * 2) * 0.3;
        // Tertiary wave (fine details)
        const wave3 = Math.sin(x * 8.1 + offset * 2.3 + seed * 3) * 0.1;
        
        return wave1 + wave2 + wave3;
    }
    
    // Generate smooth points with interpolation
    const rawPoints = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // Generate smooth noise-based radius variation
        const noiseValue = smoothNoise(i * 0.4, angle);
        
        // Progressive variation - less chaos at small sizes, more at larger
        const progressFactor = Math.min(1, progress / 80);
        const radiusVariation = 1 + (noiseValue * maxVariation * progressFactor);
        // Allow very small radius for initial state, but ensure minimum of 0.5 to avoid invisible points
        const radius = Math.max(0.5, baseRadius * radiusVariation);
        
        // Calculate point position with better scaling
        const x = centerX + Math.cos(angle) * (radius * 0.9); // Less aggressive scaling
        const y = centerY + Math.sin(angle) * (radius * 0.9);
        
        rawPoints.push({ x, y });
    }
    
    // Smooth the points using simple averaging
    const smoothedPoints = [];
    for (let i = 0; i < rawPoints.length; i++) {
        const prev = rawPoints[(i - 1 + rawPoints.length) % rawPoints.length];
        const curr = rawPoints[i];
        const next = rawPoints[(i + 1) % rawPoints.length];
        
        // Simple smoothing - average with neighbors
        const smoothX = (prev.x * 0.15 + curr.x * 0.7 + next.x * 0.15);
        const smoothY = (prev.y * 0.15 + curr.y * 0.7 + next.y * 0.15);
        
        // Clamp to safe bounds with some overflow allowance
        const clampedX = Math.max(-10, Math.min(110, smoothX));
        const clampedY = Math.max(-10, Math.min(110, smoothY));
        
        smoothedPoints.push({ x: clampedX, y: clampedY });
    }
    
    // Build the polygon path
    for (let i = 0; i < smoothedPoints.length; i++) {
        const point = smoothedPoints[i];
        path += `${point.x}% ${point.y}%`;
        if (i < smoothedPoints.length - 1) path += ', ';
    }
    
    path += ')';
    return path;
}

// Generate unique seed for server title splatter
function getSplatterSeed(splatterType) {
    const seeds = {
        'server-title-splatter': 15.34 // Updated seed for edge-based animation
    };
    return seeds[splatterType] || Math.random() * 100;
}

// Ultra-optimized server path cache with compressed storage
const serverPathCache = new Map();
const serverNoisePatterns = new Map();

// Generate shared noise pattern for server splatters
function generateServerNoisePattern(seed, points = 24) {
    const cacheKey = `server-noise-${seed}-${points}`;
    if (serverNoisePatterns.has(cacheKey)) {
        return serverNoisePatterns.get(cacheKey);
    }
    
    const pattern = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Simplified dual-wave noise for better performance
        const wave1 = Math.sin(angle * 2.5 + seed) * 0.7;
        const wave2 = Math.sin(angle * 5.2 + seed * 2) * 0.3;
        pattern.push(wave1 + wave2);
    }
    
    serverNoisePatterns.set(cacheKey, pattern);
    return pattern;
}

// Generate optimized server coordinate points
function generateServerOptimizedPoints(progress, centerX, centerY, noisePattern) {
    const points = noisePattern.length;
    const baseRadius = progress;
    const maxVariation = 0.35;
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const progressFactor = Math.min(1, progress / 80);
        const radiusVariation = 1 + (noisePattern[i] * maxVariation * progressFactor);
        const radius = Math.max(5, baseRadius * radiusVariation);
        
        const x = Math.max(0, Math.min(100, centerX + Math.cos(angle) * (radius * 0.9)));
        const y = Math.max(0, Math.min(100, centerY + Math.sin(angle) * (radius * 0.9)));
        
        coordinates.push(x, y);
    }
    
    return coordinates;
}

// Convert server coordinate array to CSS polygon string
function serverCoordinatesToCSS(coordinates) {
    let path = 'polygon(';
    for (let i = 0; i < coordinates.length; i += 2) {
        path += `${coordinates[i].toFixed(1)}% ${coordinates[i + 1].toFixed(1)}%`;
        if (i < coordinates.length - 2) path += ', ';
    }
    path += ')';
    return path;
}

// Ultra-optimized server pre-calculation
function preCalculateServerSplatterPaths(centerX, centerY, seed) {
    const cacheKey = `${centerX}-${centerY}-${seed}`;
    if (serverPathCache.has(cacheKey)) {
        return serverPathCache.get(cacheKey);
    }
    
    const noisePattern = generateServerNoisePattern(seed, 24); // 50% fewer points
    const paths = {};
    
    // Pre-calculate paths for progress values from 0 to 150 in steps of 6 (50% fewer calculations)
    for (let progress = 0; progress <= 150; progress += 6) {
        paths[progress] = generateServerOptimizedPoints(progress, centerX, centerY, noisePattern);
    }
    
    serverPathCache.set(cacheKey, paths);
    return paths;
}

// Get pre-calculated server path with linear interpolation
function getPreCalculatedServerPath(progress, centerX, centerY, seed) {
    const cacheKey = `${centerX}-${centerY}-${seed}`;
    const paths = serverPathCache.get(cacheKey);
    
    if (!paths) {
        // Lazy initialization - only calculate when needed
        preCalculateServerSplatterPaths(centerX, centerY, seed);
        return getPreCalculatedServerPath(progress, centerX, centerY, seed);
    }
    
    const adjustedProgress = Math.max(0, Math.min(150, progress));
    const lowerKey = Math.floor(adjustedProgress / 6) * 6;
    const upperKey = Math.min(150, lowerKey + 6);
    
    // Use exact match if available
    if (paths[adjustedProgress]) {
        return serverCoordinatesToCSS(paths[adjustedProgress]);
    }
    
    // Linear interpolation between two nearest points for smoother animation
    if (paths[lowerKey] && paths[upperKey] && lowerKey !== upperKey) {
        const factor = (adjustedProgress - lowerKey) / (upperKey - lowerKey);
        const lowerCoords = paths[lowerKey];
        const upperCoords = paths[upperKey];
        const interpolated = [];
        
        for (let i = 0; i < lowerCoords.length; i++) {
            interpolated[i] = lowerCoords[i] + (upperCoords[i] - lowerCoords[i]) * factor;
        }
        
        return serverCoordinatesToCSS(interpolated);
    }
    
    // Fallback to nearest neighbor
    return serverCoordinatesToCSS(paths[lowerKey] || paths[upperKey] || paths[0]);
} 