/**
 * Footer configuration module
 * This allows customization of the footer content across different pages
 */

const footerConfig = {
    // Default navigation links
    navigation: [
        { href: 'index.html', text: 'Home' },
        { href: 'servers.html', text: 'Servers' },
        { href: 'https://store.zgrad.gg', text: 'Webstore', track: 'webstore' },
        { href: 'https://discord.gg/npc', text: 'Discord', track: 'discord' }
    ],
    
    // Default server links
    servers: [
        { href: 'servers.html#homigrad', text: 'Homigrad' },
        { href: 'servers.html#minigames', text: 'Minigames' },
        { href: 'servers.html#creative', text: 'Creative' },
        { href: 'servers.html#events', text: 'Events' }
    ],
    
    // Default support links
    support: [
        { href: 'https://discord.gg/npc', text: 'Help & Support' },
        { href: 'https://discord.gg/npc', text: 'Report a Player' },
        { href: 'https://discord.gg/npc', text: 'Ban Appeals' },
        { href: 'https://discord.gg/npc', text: 'Contact Us' }
    ],
    
    // Default legal links
    legal: [
        { href: '#', text: 'Privacy Policy' },
        { href: '#', text: 'Terms of Service' },
        { href: '#', text: 'Store Terms of Service' }
    ],
    
    // Default social media links
    social: [
        {
            href: 'https://discord.gg/npc',
            label: 'Discord',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>'
        },
        {
            href: '#',
            label: 'TikTok',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>'
        },
        {
            href: '#',
            label: 'Instagram',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'
        },
        {
            href: '#',
            label: 'YouTube',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>'
        }
    ],
    
    // Powered by link
    poweredBy: {
        href: 'https://zmod.gg?ref=zgrad',
        text: 'Powered by',
        logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 612"><path d="m283.82,222.58c-27.64,35.02-55.28,70.04-83.04,105.21h-102.79c-10.93-14.22-22.01-28.64-33.4-43.45h113.5c49.9-62.56,99.66-124.97,149.96-188.04v292.25c.21.09.41.18.62.27,27.65-35.03,55.31-70.07,83.08-105.26h102.78c10.94,14.23,22.02,28.65,33.44,43.5h-113.78c-49.81,62.67-99.46,125.15-149.61,188.25V222.82c-.25-.08-.51-.16-.76-.24Z"/></svg>'
    },
    
    // Company information
    company: {
        name: 'ZMOD, DBA ZGRAD',
        logo: 'images/logos/zgrad-large.png',
        logoAlt: 'ZGrad.gg Logo'
    }
};

// Allow pages to customize the footer by overriding the default config
function customizeFooter(customConfig) {
    return Object.assign({}, footerConfig, customConfig);
} 