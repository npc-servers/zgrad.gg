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
 * Format category label for display
 */
function formatCategory(category) {
  const categories = {
    'announcement': 'Announcement',
    'event': 'Event'
  };
  return categories[category] || 'News';
}

/**
 * Inject news data into HTML template
 */
export function injectNewsData(templateHTML, news) {
  let html = templateHTML;
  
  // Update document metadata
  html = replaceTitle(html, `${news.title} - ZGRAD News`);
  html = replaceMetaTag(html, 'description', news.loading_screen_description || news.title);
  html = replaceMetaTag(html, 'author', news.author_name);
  
  // Update canonical and URLs
  html = html.replace(
    /<link rel="canonical" href=".*?">/,
    `<link rel="canonical" href="https://zgrad.gg/news/${escapeHtml(news.slug)}">`
  );
  
  // Update Open Graph meta tags
  html = replaceMetaTag(html, 'og:title', `${news.title} - ZGRAD`, true);
  html = replaceMetaTag(html, 'og:description', news.loading_screen_description || news.title, true);
  html = replaceMetaTag(html, 'og:url', `https://zgrad.gg/news/${news.slug}`, true);
  
  // Update Twitter Card meta tags
  html = replaceMetaTag(html, 'twitter:title', `${news.title} - ZGRAD`);
  html = replaceMetaTag(html, 'twitter:description', news.loading_screen_description || news.title);
  
  // Update cover image
  if (news.cover_image) {
    html = replaceMetaTag(html, 'og:image', news.cover_image, true);
    html = replaceMetaTag(html, 'twitter:image', news.cover_image);
    
    // Update the cover image src
    html = html.replace(
      /<img src="[^"]*" alt="Cover image" class="news-article-cover-img">/,
      `<img src="${escapeHtml(news.cover_image)}" alt="${escapeHtml(news.title)}" class="news-article-cover-img">`
    );
  } else {
    // Hide cover image section if no image
    html = html.replace(
      /<figure class="news-article-cover">[\s\S]*?<\/figure>/,
      ''
    );
  }
  
  // Update cover image caption if provided
  if (news.image_caption) {
    html = html.replace(
      /<figcaption class="news-article-cover-caption"><\/figcaption>/,
      `<figcaption class="news-article-cover-caption">${escapeHtml(news.image_caption)}</figcaption>`
    );
  }
  
  // Update category badge
  const categoryClass = `category-${news.category || 'announcement'}`;
  const categoryLabel = formatCategory(news.category);
  html = html.replace(
    /<span class="news-article-category[^"]*">.*?<\/span>/,
    `<span class="news-article-category ${categoryClass}">${categoryLabel}</span>`
  );
  
  // Update title
  const titleUpper = news.title.toUpperCase();
  html = html.replace(
    /<h1 class="news-article-title" data-text=".*?">.*?<\/h1>/,
    `<h1 class="news-article-title" data-text="${escapeHtml(titleUpper)}">${escapeHtml(titleUpper)}</h1>`
  );
  
  // Update author info
  let authorAvatarUrl = '/images/logos/zgrad-logopiece-z.png';
  if (news.author_avatar && news.author_id) {
    authorAvatarUrl = `https://cdn.discordapp.com/avatars/${news.author_id}/${news.author_avatar}.png`;
  }
  
  html = html.replace(
    /<img src="[^"]*" alt="Author" class="news-article-author-avatar">/,
    `<img src="${escapeHtml(authorAvatarUrl)}" alt="${escapeHtml(news.author_name || 'ZGRAD')}" class="news-article-author-avatar">`
  );
  
  html = html.replace(
    /<span class="news-article-author-name">.*?<\/span>/,
    `<span class="news-article-author-name">${escapeHtml(news.author_name || 'ZGRAD')}</span>`
  );
  
  // Update date
  html = html.replace(
    /<span class="news-article-date">.*?<\/span>/,
    `<span class="news-article-date">${formatDate(news.created_at)}</span>`
  );
  
  // Inject the actual news content
  html = html.replace(
    /<div class="news-article-content">[^]*?<\/div>/,
    `<div class="news-article-content">${news.content}</div>`
  );
  
  return html;
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

