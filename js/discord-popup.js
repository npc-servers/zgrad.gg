/**
 * Discord Join Popup - Shows once for first-time visitors
 */

const DISCORD_POPUP_KEY = 'zgrad_discord_popup_shown';
const DISCORD_INVITE_URL = 'https://discord.gg/npc';

class DiscordPopup {
    constructor() {
        this.popup = null;
        this.overlay = null;
        this.hasBeenShown = localStorage.getItem(DISCORD_POPUP_KEY) === 'true';
        
        if (!this.hasBeenShown) {
            this.init();
        }
    }

    init() {
        // Wait for page to load before showing popup
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.showAfterDelay());
        } else {
            this.showAfterDelay();
        }
    }

    showAfterDelay() {
        // Show popup after 30 seconds to let user explore the site first
        setTimeout(() => this.show(), 30000);
    }

    createPopup() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'discord-popup-overlay';
        
        // Create popup container
        this.popup = document.createElement('div');
        this.popup.className = 'discord-popup';
        
        this.popup.innerHTML = `
            <button class="discord-popup-close" aria-label="Close popup">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            
            <div class="discord-popup-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
            </div>
            
            <h2 class="discord-popup-title">Join Our Community!</h2>
            <p class="discord-popup-text">
                Connect with other players, get help, and stay updated on the latest news and updates.
            </p>
            
            <div class="discord-popup-buttons">
                <a href="${DISCORD_INVITE_URL}" target="_blank" rel="noopener" class="discord-popup-btn discord-popup-btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    Join Discord
                </a>
                <button class="discord-popup-btn discord-popup-btn-secondary">
                    Maybe Later
                </button>
            </div>
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.popup);

        // Add event listeners
        this.popup.querySelector('.discord-popup-close').addEventListener('click', () => this.close());
        this.popup.querySelector('.discord-popup-btn-secondary').addEventListener('click', () => this.close());
        this.popup.querySelector('.discord-popup-btn-primary').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        // Prevent popup clicks from closing
        this.popup.addEventListener('click', (e) => e.stopPropagation());

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup) {
                this.close();
            }
        });
    }

    show() {
        this.createPopup();
        
        // Trigger animation after a frame
        requestAnimationFrame(() => {
            this.overlay.classList.add('discord-popup-visible');
            this.popup.classList.add('discord-popup-visible');
        });

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    close() {
        // Mark as shown
        localStorage.setItem(DISCORD_POPUP_KEY, 'true');
        this.hasBeenShown = true;

        // Animate out
        this.overlay.classList.remove('discord-popup-visible');
        this.popup.classList.remove('discord-popup-visible');

        // Remove elements after animation
        setTimeout(() => {
            this.overlay?.remove();
            this.popup?.remove();
            this.overlay = null;
            this.popup = null;
            document.body.style.overflow = '';
        }, 300);
    }
}

// Initialize popup
new DiscordPopup();

