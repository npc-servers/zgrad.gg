#!/usr/bin/env node
/**
 * Utility script to manage local development images in D1
 * Usage: node scripts/manage-local-images.js [command]
 * 
 * Commands:
 *   list    - List all stored images
 *   count   - Count total images
 *   clear   - Delete all images (with confirmation)
 *   info    - Show detailed info about an image (requires filename)
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const DB_NAME = 'zgrad-cms';

// Helper to execute wrangler commands
function executeD1Command(query) {
  try {
    const command = `npx wrangler d1 execute ${DB_NAME} --local --command "${query}"`;
    const output = execSync(command, { encoding: 'utf-8' });
    return output;
  } catch (error) {
    console.error('Error executing command:', error.message);
    process.exit(1);
  }
}

// Helper to parse wrangler output
function parseResults(output) {
  try {
    // Extract JSON from wrangler output
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data[0]?.results || [];
    }
    return [];
  } catch (error) {
    console.error('Error parsing results:', error.message);
    return [];
  }
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format timestamp
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// Commands
function listImages() {
  console.log('📋 Fetching images from local database...\n');
  const output = executeD1Command(
    'SELECT filename, content_type, size, uploaded_at FROM local_images ORDER BY uploaded_at DESC'
  );
  const results = parseResults(output);
  
  if (results.length === 0) {
    console.log('No images found in local storage.');
    return;
  }
  
  console.log(`Found ${results.length} image(s):\n`);
  results.forEach((img, index) => {
    console.log(`${index + 1}. ${img.filename}`);
    console.log(`   Type: ${img.content_type}`);
    console.log(`   Size: ${formatBytes(img.size)}`);
    console.log(`   Uploaded: ${formatDate(img.uploaded_at)}`);
    console.log('');
  });
}

function countImages() {
  console.log('🔢 Counting images...\n');
  const output = executeD1Command(
    'SELECT COUNT(*) as count, SUM(size) as total_size FROM local_images'
  );
  const results = parseResults(output);
  
  if (results.length > 0) {
    const { count, total_size } = results[0];
    console.log(`Total images: ${count}`);
    console.log(`Total size: ${formatBytes(total_size || 0)}`);
  } else {
    console.log('No images found.');
  }
}

function clearImages() {
  console.log('⚠️  WARNING: This will delete ALL local images!');
  console.log('This cannot be undone.\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Type "yes" to confirm: ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'yes') {
      console.log('\n🗑️  Deleting all images...');
      executeD1Command('DELETE FROM local_images');
      console.log('✅ All images deleted.');
    } else {
      console.log('❌ Cancelled.');
    }
  });
}

function imageInfo(filename) {
  if (!filename) {
    console.error('❌ Please provide a filename');
    console.log('Usage: node scripts/manage-local-images.js info <filename>');
    process.exit(1);
  }
  
  console.log(`🔍 Fetching info for: ${filename}\n`);
  const output = executeD1Command(
    `SELECT * FROM local_images WHERE filename = '${filename}'`
  );
  const results = parseResults(output);
  
  if (results.length === 0) {
    console.log('Image not found.');
    return;
  }
  
  const img = results[0];
  console.log('Image Details:');
  console.log(`  ID: ${img.id}`);
  console.log(`  Filename: ${img.filename}`);
  console.log(`  Content Type: ${img.content_type}`);
  console.log(`  Size: ${formatBytes(img.size)}`);
  console.log(`  Hash: ${img.hash}`);
  console.log(`  Uploaded By: ${img.uploaded_by}`);
  console.log(`  Uploaded At: ${formatDate(img.uploaded_at)}`);
  console.log(`\n  URL: http://localhost:5173/images/guides/${img.filename}`);
}

function showHelp() {
  console.log('🖼️  Local Image Management Tool\n');
  console.log('Usage: node scripts/manage-local-images.js [command]\n');
  console.log('Commands:');
  console.log('  list             List all stored images');
  console.log('  count            Count total images and storage size');
  console.log('  clear            Delete all images (with confirmation)');
  console.log('  info <filename>  Show detailed info about an image');
  console.log('  help             Show this help message');
}

// Main
const [,, command, ...args] = process.argv;

switch (command) {
  case 'list':
    listImages();
    break;
  case 'count':
    countImages();
    break;
  case 'clear':
    clearImages();
    break;
  case 'info':
    imageInfo(args[0]);
    break;
  case 'help':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

