// Rules Configuration for ZGRAD
const rulesConfig = {
    title: "SERVER RULES",
    subtitle: [
        "discord.gg/npc",
        "zgrad.gg", 
        "store.npcz.gg"
    ],
    rules: [
        {
            id: 1,
            title: "NO OFFENSIVE LANGUAGE",
            description: "Slurs, dogwhistles, or any other hate speech is not allowed."
        },
        {
            id: 2,
            title: "NO POLITICS & SENSITIVE SUBJECTS",
            description: "Absolutely no politics or sensitive subjects are allowed. Politics, wars, mass shootings, etc. should not be discussed."
        },
        {
            id: 3,
            title: "NO RANDOM DEATH MATCHING (RDM)",
            description: "RDM happens, but excessive RDM, targeting players, or revenge killing is not allowed."
        },
        {
            id: 4,
            title: "RESPECT ALL PLAYERS",
            description: "Treat everyone with respect. Excessive Harassment, hate speech, and personal attacks will not be tolerated."
        },
        {
            id: 5,
            title: "NO EXPLOITING OR CHEATING",
            description: "Do not exploit bugs or glitches- report them on the Discord. Cheating will result in a global ban from all servers."
        },
        {
            id: 6,
            title: "STAY INBOUNDS",
            description: "Do not abuse mechanics to get out of bounds on maps."
        },
        {
            id: 7,
            title: "NO GREIFING",
            description: "Avoid behavior that disrupts the game experience for others. Refrain from excessive mic spam, punching players without valid reason, or other forms of disruptive gameplay."
        },
        {
            id: 8,
            title: "NO METAGAMING",
            description: "Do not use knowledge gained from out-of-character sources (Private Voice-chats/Direct Messages) to influence your in-game decisions."
        },
        {
            id: 9,
            title: "VOTE ABUSE",
            description: "Voting should not be abused. Voting (votesmiting, etc) should only be used against a player for a legitimate rule break. Votes need to have a proper reason. Do not leave them blank, and do not write something unserious. If you abuse this system, this permission will be revoked."
        },
        {
            id: 10,
            title: "HAVE FUN AND DON'T BE A DICK",
            description: "Remember that games are meant to be enjoyed by everyone. If you're not having fun, leave and take a break."
        }
    ],
    footer: {
        text: "Violations of these rules may result in warnings, temporary bans, or permanent bans depending on severity and frequency. Staff reserve the right to make judgment calls on situations not explicitly covered by these rules. By playing on our servers, you agree to our <a href=\"#\" target=\"_blank\" rel=\"noopener\" class=\"inline-link\">Terms of Service</a>, <a href=\"#\" target=\"_blank\" rel=\"noopener\" class=\"inline-link\">Privacy Policy</a>, and <a href=\"#\" target=\"_blank\" rel=\"noopener\" class=\"inline-link\">Universal Community Guidelines</a>.",
        links: [
            {
                text: "Appeal a Ban",
                url: "guides/ban-appeal",
                target: "_self"
            },
            {
                text: "Report a Player", 
                url: "guides/player-report",
                target: "_self"
            },
            {
                text: "Join Discord",
                url: "https://discord.gg/npc",
                target: "_blank"
            }
        ]
    }
};

// Function to generate rules HTML
function generateRulesHTML() {
    const rulesContainer = document.querySelector('.rules-container');
    if (!rulesContainer) return;

    // Clear existing content
    rulesContainer.innerHTML = '';

    const isGMod = isGModClient();

    // Generate rule items
    rulesConfig.rules.forEach(rule => {
        const ruleItem = document.createElement('div');
        ruleItem.className = 'rule-item';
        ruleItem.id = `rule-${rule.id}`;
        
        const ruleContent = document.createElement('div');
        ruleContent.className = 'rule-content';
        
        // Create title container that will hold both title and copy button
        const ruleTitleContainer = document.createElement('div');
        ruleTitleContainer.className = 'rule-title-container';
        
        const ruleTitle = document.createElement('div');
        ruleTitle.className = 'rule-title';
        ruleTitle.textContent = `${String(rule.id).padStart(2, '0')}. ${rule.title}`;
        
        ruleTitleContainer.appendChild(ruleTitle);
        
        // Add copy link button for non-GMod users
        if (!isGMod) {
            const copyButton = document.createElement('button');
            copyButton.className = 'rule-copy-button';
            copyButton.innerHTML = '<img src="images/icons/paperclip.svg" alt="Copy link">';
            copyButton.title = 'Copy link to this rule';
            copyButton.setAttribute('aria-label', `Copy link to rule ${rule.id}`);
            
            copyButton.addEventListener('click', function(e) {
                e.preventDefault();
                const ruleUrl = `${window.location.origin}${window.location.pathname}#rule-${rule.id}`;
                
                // Copy to clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(ruleUrl).then(() => {
                        showCopyFeedback(copyButton);
                    }).catch(() => {
                        fallbackCopyTextToClipboard(ruleUrl, copyButton);
                    });
                } else {
                    fallbackCopyTextToClipboard(ruleUrl, copyButton);
                }
            });
            
            ruleTitleContainer.appendChild(copyButton);
        }
        
        const ruleDescription = document.createElement('div');
        ruleDescription.className = 'rule-description';
        ruleDescription.textContent = rule.description;
        
        ruleContent.appendChild(ruleTitleContainer);
        ruleContent.appendChild(ruleDescription);
        
        ruleItem.appendChild(ruleContent);
        rulesContainer.appendChild(ruleItem);
    });
}

// Function to generate subtitle HTML
function generateSubtitleHTML() {
    const rulesSubtitle = document.querySelector('.rules-subtitle');
    if (!rulesSubtitle) return;

    // Clear existing content
    rulesSubtitle.innerHTML = '';

    const isGMod = isGModClient();

    if (isGMod) {
        // Generate subtitle boxes for GMod clients with click handlers
        const subtitleData = [
            { text: 'discord.gg/npc', action: 'discord' },
            { text: 'zgrad.gg', action: 'website' },
            { text: 'store.npcz.gg', action: 'store' }
        ];

        subtitleData.forEach(item => {
            const subtitleBox = document.createElement('div');
            subtitleBox.className = 'rules-subtitle-box clickable-box';
            subtitleBox.textContent = item.text;
            
            // Add click handler to send message to parent window
            subtitleBox.addEventListener('click', function() {
                // Send message to parent window (which has access to Lua functions)
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'openURL',
                        action: item.action
                    }, '*');
                }
            });
            
            rulesSubtitle.appendChild(subtitleBox);
        });
    } else {
        // Show single subtitle box for non-GMod users
        const subtitleBox = document.createElement('div');
        subtitleBox.className = 'rules-subtitle-box';
        subtitleBox.textContent = 'Rules to follow while playing on ZGRAD';
        rulesSubtitle.appendChild(subtitleBox);
    }
}

// Function to detect GMod user agent
function isGModClient() {
    return navigator.userAgent.toLowerCase().includes('gmod');
}

// Function to generate footer HTML
function generateFooterHTML() {
    const rulesFooterLinks = document.querySelector('.rules-footer-links');
    const rulesFooterText = document.querySelector('.rules-footer-text');
    
    if (!rulesFooterLinks) return;

    // Update footer text with HTML content
    if (rulesFooterText) {
        rulesFooterText.innerHTML = rulesConfig.footer.text;
    }

    // Clear existing content
    rulesFooterLinks.innerHTML = '';

    const isGMod = isGModClient();

    // Add GMod-specific class to the container if needed
    if (isGMod) {
        rulesFooterLinks.classList.add('gmod-client');
    }

        // Generate footer links
    rulesConfig.footer.links.forEach(link => {
        // Skip "Appeal a Ban" link for GMod clients
        if (isGMod && link.text === "Appeal a Ban") {
            return;
        }
        
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        
        // For GMod clients, show the Discord link without https://
        if (isGMod && link.text === "Join Discord") {
            linkElement.textContent = link.url.replace('https://', '');
        } else {
            linkElement.textContent = link.text;
        }
        
        // Use the same button style for both GMod and regular web
        linkElement.className = 'footer-link';
        
        if (link.target === '_blank') {
            linkElement.rel = 'noopener';
            linkElement.target = '_blank';
        }
        
        rulesFooterLinks.appendChild(linkElement);
    });
}

// Utility functions for clipboard functionality
function showCopyFeedback(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<img src="images/icons/check.svg" alt="Copied">';
    button.style.filter = 'brightness(0) saturate(100%) invert(64%) sepia(88%) saturate(3207%) hue-rotate(90deg) brightness(96%) contrast(80%)'; // Green filter
    
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.filter = '';
    }, 2000);
}

function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyFeedback(button);
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

// Function to handle hash navigation and highlighting
function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#rule-')) {
        const ruleElement = document.querySelector(hash);
        if (ruleElement) {
            // Remove any existing highlights
            document.querySelectorAll('.rule-item.highlighted').forEach(el => {
                el.classList.remove('highlighted');
            });
            
            // Add highlight to the target rule
            ruleElement.classList.add('highlighted');
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                ruleElement.classList.remove('highlighted');
            }, 3000);
            
            // Scroll to center the rule in the viewport
            setTimeout(() => {
                // Use scrollIntoView with center block positioning
                ruleElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }, 100);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add GMod class to body if GMod client is detected
    if (isGModClient()) {
        document.body.classList.add('gmod-client');
    }
    
    generateSubtitleHTML();
    generateRulesHTML();
    generateFooterHTML();
    
    // Handle initial hash navigation
    handleHashNavigation();
    
    // Handle hash changes (when user navigates via hash links)
    window.addEventListener('hashchange', handleHashNavigation);
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = rulesConfig;
}
