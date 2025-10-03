#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Get the last commit date for a file
function getLastModified(filePath) {
    try {
        const gitDate = execSync(`git log -1 --format="%ai" -- "${filePath}"`, { encoding: 'utf8' }).trim();
        if (gitDate) {
            return new Date(gitDate).toISOString().split('T')[0];
        }
    } catch (error) {
        console.warn(`Could not get git date for ${filePath}, using current date`);
    }
    return new Date().toISOString().split('T')[0];
}

// Define your site structure
const pages = [
    {
        loc: 'https://zgrad.gg/',
        file: 'index.html',
        changefreq: 'weekly',
        priority: '1.0',
        images: [
            {
                loc: 'https://zgrad.gg/images/logos/zgrad-logo.png',
                title: 'ZGRAD Logo',
                caption: 'ZGRAD Logo'
            }
        ]
    },
    {
        loc: 'https://zgrad.gg/servers',
        file: 'servers.html',
        changefreq: 'daily',
        priority: '0.9'
    },
    {
        loc: 'https://zgrad.gg/rules',
        file: 'rules.html',
        changefreq: 'monthly',
        priority: '0.7'
    },
    {
        loc: 'https://zgrad.gg/discord',
        file: 'discord.html',
        changefreq: 'monthly',
        priority: '0.7'
    },
    {
        loc: 'https://zgrad.gg/store',
        file: 'store.html',
        changefreq: 'monthly',
        priority: '0.7'
    },
    {
        loc: 'https://zgrad.gg/guides/ban-appeal',
        file: 'guides/ban-appeal.html',
        changefreq: 'monthly',
        priority: '0.6',
        images: [
            {
                loc: 'https://zgrad.gg/images/guides/bg/appeal-ban.png',
                title: 'Ban Appeal Guide',
                caption: 'How to Appeal a Ban on ZGRAD Servers'
            }
        ]
    },
    {
        loc: 'https://zgrad.gg/guides/player-report',
        file: 'guides/player-report.html',
        changefreq: 'monthly',
        priority: '0.6',
        images: [
            {
                loc: 'https://zgrad.gg/images/guides/bg/reporting-players.jpg',
                title: 'Player Report Guide',
                caption: 'How to Report Players on ZGRAD Servers'
            }
        ]
    },
    {
        loc: 'https://zgrad.gg/connect/us1',
        file: 'connect/us1.html',
        changefreq: 'monthly',
        priority: '0.5'
    },
    {
        loc: 'https://zgrad.gg/connect/us2',
        file: 'connect/us2.html',
        changefreq: 'monthly',
        priority: '0.5'
    },
    {
        loc: 'https://zgrad.gg/connect/us3',
        file: 'connect/us3.html',
        changefreq: 'monthly',
        priority: '0.5'
    },
    {
        loc: 'https://zgrad.gg/connect/us4',
        file: 'connect/us4.html',
        changefreq: 'monthly',
        priority: '0.5'
    }
];

// Generate sitemap XML
function generateSitemap() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    `;

    pages.forEach(page => {
        const lastmod = getLastModified(page.file);
        
        xml += `
    <url>
        <loc>${page.loc}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>`;

        if (page.images) {
            page.images.forEach(image => {
                xml += `
        <image:image>
            <image:loc>${image.loc}</image:loc>
            <image:title>${image.title}</image:title>
            <image:caption>${image.caption}</image:caption>
        </image:image>`;
            });
        }

        xml += `
    </url>`;
    });

    xml += `
    
</urlset>
`;

    return xml;
}

// Write the sitemap
const sitemapContent = generateSitemap();
fs.writeFileSync('sitemap.xml', sitemapContent);
console.log('✅ Sitemap generated successfully with updated lastmod dates!');
console.log('📅 Pages updated:');
pages.forEach(page => {
    const lastmod = getLastModified(page.file);
    console.log(`   ${page.loc} → ${lastmod}`);
});
