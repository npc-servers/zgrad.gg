class NPCRedirect extends HTMLElement {
    constructor() {
        super();
        
        const type = this.getAttribute('type') || 'game';
        
        if (type === 'game') {
            this.innerHTML = `
                <div class="background-container">
                    <img class="background-image active" alt="">
                    <img class="background-image" alt="">
                    <img class="background-image" alt="">
                </div>

                <div class="gradient-overlay"></div>

                <div class="connecting-text">
                    <span class="glint-text">${this.getAttribute('txt')}</span>
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                </div>
            `;
            
            this.initializeGameRedirect();
        } else {
            this.innerHTML = `
                <div class="simple-redirect">
                    <span class="glint-text">${this.getAttribute('txt')}</span>
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                </div>
            `;
            this.initializeSimpleRedirect();
        }
    }

    async initializeGameRedirect() {
        // Start background rotation
        this.initializeBackgrounds();
        
        // Handle Steam connection
        setTimeout(() => {
            const url = this.getAttribute('url');
            if (url) {
                window.location.href = url;
            }
        }, 2000);
    }

    initializeSimpleRedirect() {
        setTimeout(() => {
            const url = this.getAttribute('url');
            if (url) {
                window.location.href = url;
            }
        }, 2000);
    }

    async loadImageList() {
        try {
            const response = await fetch('/assets/screenshots/manifest.json');
            const data = await response.json();
            return data.images;
        } catch (error) {
            console.error('Error loading image manifest:', error);
            return [];
        }
    }

    async initializeBackgrounds() {
        const imageList = await this.loadImageList();
        if (imageList.length === 0) return;

        const backgrounds = this.querySelectorAll('.background-image');
        
        const setRandomImage = (element) => {
            const imageName = imageList[Math.floor(Math.random() * imageList.length)];
            element.src = `/assets/screenshots/${imageName}`;
        };

        backgrounds.forEach(bg => setRandomImage(bg));

        let currentBg = 0;
        setInterval(() => {
            backgrounds[currentBg].classList.remove('active');
            currentBg = (currentBg + 1) % backgrounds.length;
            setRandomImage(backgrounds[currentBg]);
            backgrounds[currentBg].classList.add('active');
        }, 5000);
    }
}

// Register the custom element
customElements.define('npc-redirect', NPCRedirect);