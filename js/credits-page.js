/**
 * Credits Page Configuration and Rendering
 * Handles dynamic generation of credits sections and team members
 */

// Credits data structure
const creditsData = {
    'Management': [
        {
            name: 'Charity',
            roles: ['Co-Lead', 'Founder', 'Lead Web Developer']
        },
        {
            name: 'Desu',
            roles: ['Co-Lead', 'Lead Developer']
        },
        {
            name: 'Redox',
            roles: ['Co-Lead', 'Founder', 'Lead Infrastructure Developer']
        }
    ],
    'Development': [
        {
            name: 'Uzelezz',
            roles: ['Programmer']
        },
        {
            name: 'Mannytko',
            roles: ['Programmer']
        },
        {
            name: 'thecraftianman',
            roles: ['Programmer']
        },
        {
            name: 'unender',
            roles: ['Programmer', 'Texture Artist']
        }
    ],
    'Art Department': [
        {
            name: 'Andreas',
            roles: ['Lead Mapper']
        },
        {
            name: 'DarcyZx',
            roles: ['Modeler', 'Texture Artist', 'Mapper']
        },
        {
            name: 'Wildcard',
            roles: ['Source Engine Genius']
        },
        {
            name: 'frogzj',
            roles: ['Mapper']
        },
        {
            name: 'Zettabyte',
            roles: ['Mapper']
        },
        {
            name: 'kodinamisting',
            roles: ['Lead Animator']
        },
        {
            name: 'Cossine',
            roles: ['Animator']
        },
        {
            name: 'KuroHeights',
            roles: ['Animator']
        },
        {
            name: 'ItsALiving',
            roles: ['Animator']
        },
        {
            name: 'Marvin',
            roles: ['Animator']
        },
        {
            name: 'skuntbob',
            roles: ['Animator']
        },
        {
            name: 'canekicker',
            roles: ['Animator']
        },
        {
            name: 'dummified',
            roles: ['Animator']
        },
        {
            name: 'Budloks',
            roles: ['Animator']
        }
    ]
};

/**
 * Initialize and render the credits page
 */
function initializeCreditsPage() {
    const container = document.querySelector('.credits-container');
    
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Generate credits sections
    Object.entries(creditsData).forEach(([sectionTitle, members]) => {
        const section = createCreditsSection(sectionTitle, members);
        container.appendChild(section);
    });
}

/**
 * Create a credits section with members
 * @param {string} title - Section title
 * @param {Array} members - Array of member objects
 * @returns {HTMLElement} - Section element
 */
function createCreditsSection(title, members) {
    const section = document.createElement('div');
    section.className = 'credits-section';
    
    // Create section title
    const titleElement = document.createElement('h2');
    titleElement.className = 'credits-section-title';
    titleElement.textContent = title;
    section.appendChild(titleElement);
    
    // Create grid for members
    const grid = document.createElement('div');
    grid.className = 'credits-grid';
    
    // Add each member
    members.forEach(member => {
        const item = createCreditItem(member);
        grid.appendChild(item);
    });
    
    section.appendChild(grid);
    return section;
}

/**
 * Create an individual credit item
 * @param {Object} member - Member object with name and roles
 * @returns {HTMLElement} - Credit item element
 */
function createCreditItem(member) {
    const item = document.createElement('div');
    item.className = 'credit-item';
    
    const content = document.createElement('div');
    content.className = 'credit-content';
    
    // Create member name
    const name = document.createElement('div');
    name.className = 'credit-name';
    name.textContent = member.name;
    content.appendChild(name);
    
    // Create roles container
    const rolesContainer = document.createElement('div');
    rolesContainer.className = 'credit-roles';
    
    // Add each role as a badge
    member.roles.forEach(role => {
        const roleBadge = document.createElement('span');
        roleBadge.className = 'credit-role';
        roleBadge.textContent = role;
        rolesContainer.appendChild(roleBadge);
    });
    
    content.appendChild(rolesContainer);
    item.appendChild(content);
    
    return item;
}

/**
 * Handle mobile menu toggle for navbar consistency
 */
function setupMobileMenu() {
    const hamburger = document.querySelector('.navbar-hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (!hamburger || !mobileMenu) return;
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    const mobileLinks = mobileMenu.querySelectorAll('.nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

/**
 * Add smooth scroll behavior to navigation links
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}


// Initialize page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeCreditsPage();
        setupMobileMenu();
        setupSmoothScroll();
    });
} else {
    initializeCreditsPage();
    setupMobileMenu();
    setupSmoothScroll();
}

