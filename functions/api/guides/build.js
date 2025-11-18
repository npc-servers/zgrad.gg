// API endpoint to trigger static site rebuild
// This endpoint fetches all published guides and returns them in a format
// suitable for static site generation

export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify build secret (set in Cloudflare Pages environment)
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = env.BUILD_SECRET;

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Fetch all published guides
    const { results: guides } = await env.DB.prepare(
      'SELECT id, slug, title, description, content, thumbnail, author_id, author_name, author_avatar, created_at, updated_at FROM guides WHERE status = ? ORDER BY created_at DESC'
    )
      .bind('published')
      .all();

    // Generate HTML for each guide
    const generatedGuides = guides.map(guide => ({
      slug: guide.slug,
      title: guide.title,
      description: guide.description,
      content: guide.content,
      thumbnail: guide.thumbnail,
      author: {
        id: guide.author_id,
        name: guide.author_name,
        avatar: guide.author_avatar,
      },
      createdAt: guide.created_at,
      updatedAt: guide.updated_at,
      html: generateGuideHTML(guide),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        guides: generatedGuides,
        count: generatedGuides.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating guides:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate guides' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

function generateGuideHTML(guide) {
  const authorAvatarUrl = guide.author_avatar
    ? `https://cdn.discordapp.com/avatars/${guide.author_id}/${guide.author_avatar}.png`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="origin-when-cross-origin">
    
    <!-- SEO Meta Tags -->
    <title>${escapeHtml(guide.title)} - ZGRAD Help Guide</title>
    <meta name="description" content="${escapeHtml(guide.description || '')}">
    <meta name="keywords" content="ZGRAD, guide, help, tutorial, ${escapeHtml(guide.slug)}">
    <meta name="author" content="${escapeHtml(guide.author_name)}">
    <meta name="thumbnail" content="${escapeHtml(guide.thumbnail || '')}">
    <link rel="canonical" href="https://zgrad.gg/guides/${guide.slug}">
    <link rel="icon" href="../favicon.ico">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(guide.title)} - ZGRAD Help Guide">
    <meta property="og:description" content="${escapeHtml(guide.description || '')}">
    <meta property="og:image" content="${escapeHtml(guide.thumbnail || 'https://zgrad.gg/images/logos/zgrad-logo.png')}">
    <meta property="og:url" content="https://zgrad.gg/guides/${guide.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="ZGRAD">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(guide.title)} - ZGRAD Help Guide">
    <meta name="twitter:description" content="${escapeHtml(guide.description || '')}">
    <meta name="twitter:image" content="${escapeHtml(guide.thumbnail || 'https://zgrad.gg/images/logos/zgrad-logo.png')}">
    
    <!-- Redirect .html to extensionless URL -->
    <script>
        if (window.location.pathname === '/guides/${guide.slug}.html') {
            window.location.replace(window.location.origin + '/guides/${guide.slug}');
        }
    </script>
</head>
<body>
    <div class="guide-page">
        ${guide.thumbnail ? `<!-- Hero Background -->
        <div class="guide-hero-bg" style="background-image: url('${escapeHtml(guide.thumbnail)}');"></div>` : ''}
        
        <!-- Header Section -->
        <div class="guide-header">
            <h1 class="guide-title" data-text="${escapeHtml(guide.title.toUpperCase())}">${escapeHtml(guide.title.toUpperCase())}</h1>
            ${guide.description ? `<p class="guide-subtitle">${escapeHtml(guide.description)}</p>` : ''}
            ${guide.author_name ? `
            <div class="guide-author">
                <img src="${authorAvatarUrl}" alt="${escapeHtml(guide.author_name)}" class="guide-author-avatar">
                <div class="guide-author-info">
                    <span class="guide-author-label">Written by</span>
                    <span class="guide-author-name">${escapeHtml(guide.author_name)}</span>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Navigation -->
        <div class="guide-nav">
            <a href="../" class="back-button">
                <svg class="back-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Home
            </a>
        </div>

        <!-- Content Area -->
        <div class="guide-content">
            ${guide.content}
        </div>
    </div>

    <!-- External Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    
    <!-- Main module entry point (Vite) -->
    <script type="module" src="/src/guides.js"></script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}




