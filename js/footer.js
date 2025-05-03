document.addEventListener('DOMContentLoaded', function() {
    const footerElement = document.querySelector('footer.footer');
    
    if (!footerElement) {
        console.error('Footer element not found');
        return;
    }
    
    // Get any page-specific footer configuration
    let config = window.footerConfig || {};
    
    // Get any custom footer config for this page if it exists in the global scope
    if (window.customFooterConfig) {
        config = customizeFooter(window.customFooterConfig);
    }
    
    // Create footer content
    const footerHTML = createFooterHTML(config);
    footerElement.innerHTML = footerHTML;
    
    // Initialize event listeners after creating footer content
    initializeFooterEvents();
});

/**
 * Creates the entire footer HTML structure
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} The HTML content for the footer
 */
function createFooterHTML(config = {}) {
    const currentYear = new Date().getFullYear();
    const company = config.company || footerConfig.company;
    
    return `
        <div class="footer-container">
            <div class="footer-logo">
                <img src="${company.logo}" alt="${company.logoAlt}">
            </div>
            
            ${createNavigationColumn(config)}
            ${createServersColumn(config)}
            ${createSupportColumn(config)}
            ${createAdditionalColumns(config)}
            
            <div class="footer-bottom">
                <div class="footer-bottom-left">
                    <p>&copy; <span id="copyright-year">${currentYear}</span> ${company.name}. All rights reserved.</p>
                    <div class="footer-legal">
                        ${createLegalLinks(config)}
                    </div>
                </div>
                <div class="footer-bottom-right">
                    <div class="follow-us-text">Follow Us</div>
                    <div class="social-icons">
                        ${createSocialIcons(config)}
                    </div>
                </div>
            </div>
            ${createPoweredByLink(config)}
        </div>
    `;
}

/**
 * Creates the navigation column HTML
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} HTML for the navigation column
 */
function createNavigationColumn(config = {}) {
    const links = config.navigation || footerConfig.navigation;
    
    return `
        <div class="footer-column">
            <h3>Navigation</h3>
            <ul class="footer-links">
                ${links.map(link => createLinkHTML(link)).join('')}
            </ul>
        </div>
    `;
}

/**
 * Creates the servers column HTML
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} HTML for the servers column
 */
function createServersColumn(config = {}) {
    const links = config.servers || footerConfig.servers;
    
    return `
        <div class="footer-column">
            <h3>Servers</h3>
            <ul class="footer-links">
                ${links.map(link => createLinkHTML(link)).join('')}
            </ul>
        </div>
    `;
}

/**
 * Creates the support column HTML
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} HTML for the support column
 */
function createSupportColumn(config = {}) {
    const links = config.support || footerConfig.support;
    
    return `
        <div class="footer-column">
            <h3>Support</h3>
            <ul class="footer-links">
                ${links.map(link => createLinkHTML(link)).join('')}
            </ul>
        </div>
    `;
}

/**
 * Creates HTML for legal links
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} HTML for legal links
 */
function createLegalLinks(config = {}) {
    const links = config.legal || footerConfig.legal;
    return links.map(link => `<a href="${link.href}">${link.text}</a>`).join('');
}

/**
 * Creates HTML for a link
 * @param {Object} link - The link object with href, text, and optional track property
 * @returns {string} HTML for the link
 */
function createLinkHTML(link) {
    const trackAttr = link.track ? ` data-track="${link.track}"` : '';
    const currentClass = link.current ? ' class="current"' : '';
    return `<li><a href="${link.href}"${trackAttr}${currentClass}>${link.text}</a></li>`;
}

/**
 * Creates HTML for social media icons
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} HTML for social media icons
 */
function createSocialIcons(config = {}) {
    const icons = config.social || footerConfig.social;
    
    return icons.map(icon => {
        return `<a href="${icon.href}" aria-label="${icon.label}">${icon.svg}</a>`;
    }).join('');
}

/**
 * Creates HTML for the powered by link
 * @param {Object} config - Optional configuration to override defaults
 * @returns {string} HTML for the powered by link
 */
function createPoweredByLink(config = {}) {
    const poweredBy = config.poweredBy || footerConfig.poweredBy;
    
    return `
        <a href="${poweredBy.href}" class="powered-by-zmod">
            <span>${poweredBy.text}</span>
            <div class="zmod-logo">
                ${poweredBy.logo}
            </div>
        </a>
    `;
}

/**
 * Creates HTML for additional columns if specified in config
 * @param {Object} config - Configuration object
 * @returns {string} HTML for additional columns
 */
function createAdditionalColumns(config = {}) {
    if (!config.additionalColumns || !config.additionalColumns.length) {
        return '';
    }
    
    return config.additionalColumns.map(column => {
        return `
            <div class="footer-column">
                <h3>${column.title}</h3>
                <ul class="footer-links">
                    ${column.links.map(link => createLinkHTML(link)).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

/**
 * Initializes all footer event listeners
 */
function initializeFooterEvents() {
    // Track clicks on footer links with data-track attribute
    const footerLinks = document.querySelectorAll('.footer-links a[data-track]');
    
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const trackName = this.getAttribute('data-track');
            // If you have analytics, you can implement tracking here
            console.log(`Tracked click on: ${trackName}`);
        });
    });
    
    // Handle social icons hover effect
    const socialIcons = document.querySelectorAll('.social-icons a');
    
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            socialIcons.forEach(otherIcon => {
                if (otherIcon !== icon) {
                    otherIcon.style.opacity = '0.5';
                }
            });
        });
        
        icon.addEventListener('mouseleave', function() {
            socialIcons.forEach(otherIcon => {
                otherIcon.style.opacity = '1';
            });
        });
    });
} 