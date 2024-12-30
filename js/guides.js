// Guides data - Add new guides here
const guides = [
    {
        id: 'getting-started',              // This should match the HTML filename (without .html)
        title: 'Getting Started with ZGRAD',
        excerpt: 'Learn the basics of playing on ZGRAD servers and get started with your journey.',
        image: '/assets/guides/getting-started.jpg',
        banner: '/assets/guides/getting-started-banner.jpg',
        author: 'ZGRAD Team',
        date: '2024-01-01',
        category: 'Getting Started'
    },
    {
        id: 'homigrad-basics',
        title: 'HOMIGRAD Game Mode Guide',
        excerpt: 'Master the basics of our flagship game mode and learn advanced strategies.',
        image: '/assets/guides/homigrad.jpg',
        banner: '/assets/guides/homigrad-banner.jpg',
        author: 'ZGRAD Team',
        date: '2024-01-02',
        category: 'Game Modes'
    },
    {
        id: 'advanced-combat',
        title: 'Advanced Combat Techniques',
        excerpt: 'Take your combat skills to the next level with these advanced techniques and strategies.',
        image: '/assets/guides/combat.jpg',
        banner: '/assets/guides/combat-banner.jpg',
        author: 'Combat Master',
        date: '2024-01-03',
        category: 'Advanced'
    },
    {
        id: 'community-events',
        title: 'Community Events Guide',
        excerpt: 'Everything you need to know about participating in and organizing community events.',
        image: '/assets/guides/events.jpg',
        banner: '/assets/guides/events-banner.jpg',
        author: 'Event Team',
        date: '2024-01-04',
        category: 'Community'
    },
    {
        id: 'weapon-mastery',
        title: 'Weapon Mastery Guide',
        excerpt: 'Detailed breakdown of all weapons and how to master them effectively.',
        image: '/assets/guides/weapons.jpg',
        banner: '/assets/guides/weapons-banner.jpg',
        author: 'Weapons Expert',
        date: '2024-01-05',
        category: 'Advanced'
    },
    {
        id: 'sandbox-creativity',
        title: 'Sandbox Mode Creative Tips',
        excerpt: 'Unleash your creativity in sandbox mode with these amazing building techniques.',
        image: '/assets/guides/sandbox.jpg',
        banner: '/assets/guides/sandbox-banner.jpg',
        author: 'Builder Pro',
        date: '2024-01-06',
        category: 'Game Modes'
    },
    {
        id: 'server-rules',
        title: 'Server Rules and Guidelines',
        excerpt: 'Complete overview of server rules, guidelines, and best practices for a great gaming experience.',
        image: '/assets/guides/rules.jpg',
        banner: '/assets/guides/rules-banner.jpg',
        author: 'Admin Team',
        date: '2024-01-07',
        category: 'Getting Started'
    },
    {
        id: 'team-tactics',
        title: 'Team Tactics and Strategy',
        excerpt: 'Learn how to work effectively with your team and coordinate advanced strategies.',
        image: '/assets/guides/tactics.jpg',
        banner: '/assets/guides/tactics-banner.jpg',
        author: 'Strategy Master',
        date: '2024-01-08',
        category: 'Advanced'
    },
    {
        id: 'custom-content',
        title: 'Custom Content Creation',
        excerpt: 'Guide to creating and submitting custom content for the server.',
        image: '/assets/guides/custom.jpg',
        banner: '/assets/guides/custom-banner.jpg',
        author: 'Content Creator',
        date: '2024-01-09',
        category: 'Community'
    },
    {
        id: 'economy-guide',
        title: 'Server Economy Guide',
        excerpt: 'Understanding the server economy, trading, and making the most of your resources.',
        image: '/assets/guides/economy.jpg',
        banner: '/assets/guides/economy-banner.jpg',
        author: 'Economy Expert',
        date: '2024-01-10',
        category: 'Getting Started'
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the guides directory page
    const guidesGrid = document.getElementById('guides-grid');
    if (guidesGrid) {
        initializeGuidesDirectory();
    }

    // Check if we're on the guides preview section (index page)
    const swiperWrapper = document.querySelector('.guides-swiper .swiper-wrapper');
    if (swiperWrapper) {
        initializeGuidesPreview();
    }
});

// Initialize guides directory
function initializeGuidesDirectory() {
    const guidesGrid = document.getElementById('guides-grid');
    const categoriesContainer = document.getElementById('guides-categories');

    // Get unique categories
    const categories = ['All', ...new Set(guides.map(guide => guide.category))].sort();

    // Populate categories
    categories.forEach(category => {
        const categoryElement = document.createElement('span');
        categoryElement.className = 'category-filter' + (category === 'All' ? ' active' : '');
        categoryElement.textContent = category;
        categoryElement.addEventListener('click', () => {
            document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
            categoryElement.classList.add('active');
            populateGuides(category);
        });
        categoriesContainer.appendChild(categoryElement);
    });

    // Populate guides
    function populateGuides(category = 'All') {
        guidesGrid.innerHTML = '';
        
        const filteredGuides = category === 'All' 
            ? guides 
            : guides.filter(guide => guide.category === category);

        if (filteredGuides.length === 0) {
            const noGuides = document.createElement('div');
            noGuides.className = 'no-guides';
            noGuides.innerHTML = '<p>No guides available in this category yet.</p>';
            guidesGrid.appendChild(noGuides);
            return;
        }

        filteredGuides.forEach((guide, index) => {
            const guideCard = document.createElement('div');
            guideCard.className = 'guide-card';
            guideCard.style.setProperty('--animation-order', index);
            guideCard.onclick = () => window.location.href = `/guides/${guide.id}`;
            
            guideCard.innerHTML = `
                <img src="${guide.image}" alt="${guide.title}" class="guide-card-image">
                <h3 class="guide-card-title">${guide.title}</h3>
                <p class="guide-card-excerpt">${guide.excerpt}</p>
                <div class="guide-card-meta">
                    <span>${guide.author}</span> • <span>${new Date(guide.date).toLocaleDateString()}</span>
                </div>
            `;
            
            guidesGrid.appendChild(guideCard);
        });

        // Immediately show guides that are in view with animation
        const cards = document.querySelectorAll('.guide-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight;
            if (isInView) {
                requestAnimationFrame(() => {
                    card.classList.add('guide-reveal', 'guide-initial');
                });
            }
        });

        // Initialize intersection observer for reveal animation of guides not in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(() => {
                        entry.target.classList.add('guide-reveal');
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.15
        });

        // Only observe cards that aren't already revealed
        cards.forEach(card => {
            if (!card.classList.contains('guide-reveal')) {
                observer.observe(card);
            }
        });
    }

    // Initial population
    populateGuides();
}

// Initialize guides preview on index page
function initializeGuidesPreview() {
    const swiperWrapper = document.querySelector('.guides-swiper .swiper-wrapper');
    
    // Populate latest guides
    guides.forEach(guide => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        slide.innerHTML = `
            <div class="guide-card" onclick="window.location.href='/guides/${guide.id}'">
                <img src="${guide.image}" alt="${guide.title}" class="guide-card-image">
                <h3 class="guide-card-title">${guide.title}</h3>
                <p class="guide-card-excerpt">${guide.excerpt}</p>
                <div class="guide-card-meta">
                    <span>${guide.author}</span> • <span>${new Date(guide.date).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        
        swiperWrapper.appendChild(slide);
    });

    let swiper = null;

    // Function to initialize or reinitialize Swiper
    function initSwiper() {
        // Destroy existing swiper instance if it exists
        if (swiper !== null) {
            swiper.destroy(true, true);
        }

        // Initialize Swiper with improved configuration
        swiper = new Swiper('.guides-swiper', {
            slidesPerView: 3,
            spaceBetween: 30,
            loop: false,
            watchSlidesProgress: true,
            watchSlidesVisibility: true,
            slidesPerGroup: 1,
            speed: 600,
            resistance: true,
            resistanceRatio: 0.8,
            touchRatio: 0.8,
            threshold: 10,
            
            // Hide navigation arrows when at the end
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
                hideOnClick: false,
                disabledClass: 'swiper-button-disabled',
                hiddenClass: 'swiper-button-hidden'
            },
            
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                type: 'bullets'
            },

            // Updated breakpoints for better mobile responsiveness
            breakpoints: {
                320: {
                    slidesPerView: 1,
                    spaceBetween: 15,
                    slidesPerGroup: 1
                },
                480: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                    slidesPerGroup: 1
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                    slidesPerGroup: 1
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                    slidesPerGroup: 1
                }
            },

            on: {
                init: function () {
                    updateNavigationVisibility(this);
                },
                slideChange: function () {
                    updateNavigationVisibility(this);
                },
                resize: function () {
                    updateNavigationVisibility(this);
                }
            }
        });
    }

    // Initialize Swiper for the first time
    initSwiper();

    // Add resize event listener with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initSwiper();
        }, 250); // Debounce resize events for better performance
    });

    // Function to update navigation visibility
    function updateNavigationVisibility(swiper) {
        const { isBeginning, isEnd } = swiper;
        const nextButton = document.querySelector('.swiper-button-next');
        const prevButton = document.querySelector('.swiper-button-prev');
        
        if (prevButton) {
            if (isBeginning) {
                prevButton.classList.add('swiper-button-hidden');
            } else {
                prevButton.classList.remove('swiper-button-hidden');
            }
        }
        
        if (nextButton) {
            if (isEnd) {
                nextButton.classList.add('swiper-button-hidden');
            } else {
                nextButton.classList.remove('swiper-button-hidden');
            }
        }
    }
} 