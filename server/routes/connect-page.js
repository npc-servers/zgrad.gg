/**
 * Dynamic Connect Page Route
 * Serves connect pages from a single template + serverConfig.js
 * No need to create individual HTML files for each server
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SERVER_GROUPS } from '../../js/serverConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Build a map of server IDs (us1, eu2, etc.) to server config
const SERVER_ID_MAP = {};
for (const server of SERVER_GROUPS) {
  // Extract the ID from the link (e.g., "connect/us1" -> "us1")
  const match = server.link.match(/connect\/(.+)/);
  if (match) {
    SERVER_ID_MAP[match[1].toLowerCase()] = server;
  }
}

// Cache the template
let templateCache = null;

function getTemplate() {
  if (templateCache) return templateCache;
  
  // Try built template first (dist), then source template
  const distTemplatePath = path.join(__dirname, '../../dist/connect/template.html');
  const srcTemplatePath = path.join(__dirname, '../../connect/template.html');
  
  const templatePath = fs.existsSync(distTemplatePath) ? distTemplatePath : srcTemplatePath;
  
  if (!fs.existsSync(templatePath)) {
    console.error('Connect template not found at:', templatePath);
    return null;
  }
  
  templateCache = fs.readFileSync(templatePath, 'utf-8');
  return templateCache;
}

/**
 * GET /connect/:serverId - Serve dynamic connect page
 */
export function serveConnectPage(req, res, next) {
  const serverId = req.params.serverId?.toLowerCase();
  
  // Check if this is a valid server ID
  const server = SERVER_ID_MAP[serverId];
  
  if (!server) {
    // Not a valid server, pass to next handler (might be a static file or 404)
    return next();
  }
  
  const template = getTemplate();
  
  if (!template) {
    return res.status(500).send('Connect template not found');
  }
  
  // Theme colors by region
  const themeColor = server.region === 'EU' ? '#0066ff' : '#ff0000';
  
  // Replace placeholders with server-specific values
  const html = template
    .replace(/\{\{SERVER_ID\}\}/g, serverId)
    .replace(/\{\{SERVER_SUFFIX\}\}/g, escapeHtml(server.suffix))
    .replace(/\{\{SERVER_TITLE\}\}/g, escapeHtml(server.title))
    .replace(/\{\{SERVER_REGION\}\}/g, escapeHtml(server.region))
    .replace(/\{\{SERVER_REGION_LOWER\}\}/g, server.region.toLowerCase())
    .replace(/\{\{THEME_COLOR\}\}/g, themeColor);
  
  res.set('Content-Type', 'text/html');
  res.send(html);
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache() {
  templateCache = null;
}

export default router;

