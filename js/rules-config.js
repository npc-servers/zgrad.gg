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
            title: "NO CHEATING OR EXPLOITING",
            description: "The use of cheats, hacks, exploits, or any third-party software that provides an unfair advantage is strictly prohibited. This includes but is not limited to aimbots, wallhacks, speed hacks, and exploiting map glitches. Players caught cheating will receive an immediate permanent ban."
        },
        {
            id: 2,
            title: "RESPECT ALL PLAYERS",
            description: "Treat all players with respect regardless of their skill level, background, or beliefs. Harassment, discrimination, hate speech, or targeted toxicity will not be tolerated. This includes offensive usernames, spray images, or voice communications."
        },
        {
            id: 3,
            title: "NO RANDOM DEATH MATCHING (RDM)",
            description: "Do not kill other players without a valid reason. In TTT, you must have evidence or witness suspicious behavior before eliminating someone. Killing innocents without cause disrupts gameplay and will result in punishment."
        },
        {
            id: 4,
            title: "NO GHOSTING OR METAGAMING",
            description: "Do not share information about the game state through external means (Discord, Steam chat, etc.) while dead or spectating. This includes revealing traitor identities, calling out locations, or providing any information that gives living players an unfair advantage."
        },
        {
            id: 5,
            title: "FOLLOW STAFF INSTRUCTIONS",
            description: "Always comply with instructions from server staff members. If you disagree with a punishment or decision, appeal it through proper channels rather than arguing in-game. Disrespecting or ignoring staff will result in additional penalties."
        },
        {
            id: 6,
            title: "NO SPAMMING OR FLOODING",
            description: "Avoid excessive use of voice chat, text chat, or game sounds. This includes mic spamming, chat flooding, sound board abuse, and playing music through your microphone. Keep communications relevant to gameplay."
        },
        {
            id: 7,
            title: "PLAY YOUR ROLE PROPERLY",
            description: "Each role in TTT has specific objectives. Traitors should work to eliminate innocents, Detectives should investigate and lead, and Innocents should survive and identify threats. Deliberately playing against your role's objectives is not allowed."
        },
        {
            id: 8,
            title: "NO CAMPING OR DELAYING",
            description: "Avoid excessive camping in one location or intentionally delaying rounds. Keep the game moving and engaging for all players. If you're the last player alive, actively participate rather than hiding indefinitely."
        },
        {
            id: 9,
            title: "REPORT VIOLATIONS PROPERLY",
            description: "Use the proper channels to report rule violations. This includes in-game reporting systems, Discord tickets, or contacting staff directly. Provide evidence when possible and avoid taking justice into your own hands."
        },
        {
            id: 10,
            title: "HAVE FUN AND BE SPORTSMAN-LIKE",
            description: "Remember that games are meant to be enjoyable for everyone. Be a good sport whether you win or lose, congratulate good plays, and help create a positive gaming environment for the entire community."
        }
    ],
    footer: {
        text: "Violations of these rules may result in warnings, temporary bans, or permanent bans depending on severity and frequency. Staff reserve the right to make judgment calls on situations not explicitly covered by these rules.",
        links: [
            {
                text: "Appeal a Ban",
                url: "guides/ban-appeal.html",
                target: "_self"
            },
            {
                text: "Report a Player", 
                url: "guides/player-report.html",
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
            copyButton.innerHTML = '🔗';
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

    // Only show subtitle boxes for GMod clients
    if (isGMod) {
        // Generate subtitle boxes
        rulesConfig.subtitle.forEach(item => {
            const subtitleBox = document.createElement('div');
            subtitleBox.className = 'rules-subtitle-box';
            subtitleBox.textContent = item;
            rulesSubtitle.appendChild(subtitleBox);
        });
    } else {
        // Hide the subtitle container for non-GMod users
        rulesSubtitle.style.display = 'none';
    }
}

// Function to detect GMod user agent
function isGModClient() {
    return navigator.userAgent.toLowerCase().includes('gmod');
}

// Function to generate footer HTML
function generateFooterHTML() {
    const rulesFooterLinks = document.querySelector('.rules-footer-links');
    if (!rulesFooterLinks) return;

    // Clear existing content
    rulesFooterLinks.innerHTML = '';

    const isGMod = isGModClient();

    // Add GMod-specific class to the container if needed
    if (isGMod) {
        rulesFooterLinks.classList.add('gmod-client');
    }

    // Generate footer links
    rulesConfig.footer.links.forEach(link => {
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.textContent = link.text;
        
        if (isGMod) {
            // For GMod clients, use a more link-like appearance
            linkElement.className = 'footer-link gmod-link';
            // Ensure links work properly in GMod's browser
            if (link.target === '_blank') {
                linkElement.rel = 'noopener';
                linkElement.target = '_blank';
                // For external links in GMod, we might want to handle them specially
                linkElement.addEventListener('click', function(e) {
                    // Let the browser handle the link normally
                    // GMod's browser should open external links in Steam overlay
                });
            }
        } else {
            // For regular browsers, keep the existing button-style links
            linkElement.className = 'footer-link';
            if (link.target === '_blank') {
                linkElement.rel = 'noopener';
                linkElement.target = '_blank';
            }
        }
        
        rulesFooterLinks.appendChild(linkElement);
    });
}

// Utility functions for clipboard functionality
function showCopyFeedback(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '✓';
    button.style.color = '#4CAF50';
    
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.color = '';
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
