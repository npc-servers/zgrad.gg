/**
 * HTML utility functions for server-side rendering
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format timestamp to human-readable date
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Replace meta tag content in HTML
 * @param {string} html - HTML string
 * @param {string} name - Meta tag name or property
 * @param {string} value - New value
 * @param {boolean} isProperty - Whether it's a property or name attribute
 * @returns {string} - Modified HTML
 */
export function replaceMetaTag(html, name, value, isProperty = false) {
  if (!value) return html;
  
  const attr = isProperty ? 'property' : 'name';
  const regex = new RegExp(`<meta ${attr}="${name}" content=".*?">`, 'g');
  const replacement = `<meta ${attr}="${name}" content="${escapeHtml(value)}">`;
  
  return html.replace(regex, replacement);
}

/**
 * Replace title tag in HTML
 * @param {string} html - HTML string
 * @param {string} title - New title
 * @returns {string} - Modified HTML
 */
export function replaceTitle(html, title) {
  if (!title) return html;
  return html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

