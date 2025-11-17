#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all guide HTML files from the guides directory
function getGuideFiles() {
    const guidesDir = path.join(__dirname, '..', 'guides');
    const files = fs.readdirSync(guidesDir);
    
    // Filter to only HTML files, excluding index.html
    const guideFiles = files.filter(file => {
        return file.endsWith('.html') && file !== 'index.html';
    });
    
    return guideFiles.map(file => {
        const slug = file.replace('.html', '');
        return {
            file: file,
            slug: slug,
            url: `/guides/${slug}`
        };
    });
}

// Generate guides manifest JSON
function generateGuidesManifest() {
    const guides = getGuideFiles();
    
    const manifest = {
        generated: new Date().toISOString(),
        guides: guides
    };
    
    return JSON.stringify(manifest, null, 2);
}

// Write the manifest file
const manifestContent = generateGuidesManifest();
const manifestPath = path.join(__dirname, '..', 'guides', 'manifest.json');
fs.writeFileSync(manifestPath, manifestContent);
console.log('✅ Guides manifest generated successfully!');
console.log(`📝 Found ${JSON.parse(manifestContent).guides.length} guides:`);
JSON.parse(manifestContent).guides.forEach(guide => {
    console.log(`   - ${guide.slug}`);
});

