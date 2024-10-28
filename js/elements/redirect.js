class Header extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const url = this.getAttribute("url");
        const txt = this.getAttribute("txt");
        let redirectTime = this.getAttribute("redirect-time");
        redirectTime = redirectTime || 0;

        let displayText = txt || "Redirecting to: " + url;

        this.innerHTML = `
        <meta http-equiv="refresh" content="${redirectTime}; url='${url}'" />

        <div class="redirect-container">
        <p class="display-text">${displayText}</p>
        </div>
        `;
    }
}

customElements.define("npc-redirect", Header);
