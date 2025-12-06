/**
 * HTML utility functions for server-side rendering (VPS version)
 */

/**
 * Escape HTML special characters to prevent XSS
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
 */
export function replaceTitle(html, title) {
  if (!title) return html;
  return html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

/**
 * Inject guide data into HTML template
 */
export function injectGuideData(templateHTML, guide) {
  let html = templateHTML;
  
  // Update document metadata
  html = replaceTitle(html, `${guide.title} - ZGRAD Help Guide`);
  html = replaceMetaTag(html, 'description', guide.description);
  html = replaceMetaTag(html, 'author', guide.author_name);
  
  // Update canonical and URLs
  html = html.replace(
    /<link rel="canonical" href=".*?">/,
    `<link rel="canonical" href="https://zgrad.gg/guides/${escapeHtml(guide.slug)}">`
  );
  
  // Update Open Graph meta tags
  html = replaceMetaTag(html, 'og:title', `${guide.title} - ZGRAD`, true);
  html = replaceMetaTag(html, 'og:description', guide.description, true);
  html = replaceMetaTag(html, 'og:url', `https://zgrad.gg/guides/${guide.slug}`, true);
  
  // Update Twitter Card meta tags
  html = replaceMetaTag(html, 'twitter:title', `${guide.title} - ZGRAD`);
  html = replaceMetaTag(html, 'twitter:description', guide.description);
  
  // Update thumbnail/images if provided
  if (guide.thumbnail) {
    html = replaceMetaTag(html, 'thumbnail', guide.thumbnail);
    html = replaceMetaTag(html, 'og:image', guide.thumbnail, true);
    html = replaceMetaTag(html, 'twitter:image', guide.thumbnail);
    
    html = html.replace(
      /(<div class="guide-hero-bg" style="background-image:)url\(['"][^'"]+['"]\)/,
      `$1url('${escapeHtml(guide.thumbnail)}')`
    );
  }
  
  // Update page title and subtitle
  const titleUpper = guide.title.toUpperCase();
  html = html.replace(
    /<h1 class="guide-title" data-text=".*?">.*?<\/h1>/,
    `<h1 class="guide-title" data-text="${escapeHtml(titleUpper)}">${escapeHtml(titleUpper)}</h1>`
  );
  
  html = html.replace(
    /<p class="guide-subtitle">.*?<\/p>/,
    `<p class="guide-subtitle">${escapeHtml(guide.description || '')}</p>`
  );
  
  // Inject the actual guide content
  html = html.replace(
    /<div class="guide-content">[^]*?<\/div>/,
    `<div class="guide-content">${guide.content}</div>`
  );
  
  return html;
}

