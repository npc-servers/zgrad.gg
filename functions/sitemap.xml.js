// Dynamic sitemap generator
// This endpoint generates a sitemap.xml that includes all published guides from the database

export async function onRequest(context) {
  const { env } = context;

  try {
    // Fetch all published guides from database
    const { results: guides } = await env.DB.prepare(
      'SELECT slug, updated_at FROM guides WHERE status = ? ORDER BY updated_at DESC'
    )
      .bind('published')
      .all();

    // Static pages with their priorities and change frequencies
    const staticPages = [
      {
        loc: 'https://zgrad.gg/',
        changefreq: 'weekly',
        priority: '1.0'
      },
      {
        loc: 'https://zgrad.gg/servers',
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: 'https://zgrad.gg/rules',
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        loc: 'https://zgrad.gg/discord',
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        loc: 'https://zgrad.gg/store',
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        loc: 'https://zgrad.gg/credits',
        changefreq: 'yearly',
        priority: '0.5'
      },
      {
        loc: 'https://zgrad.gg/guides',
        changefreq: 'daily',
        priority: '0.8'
      },
      {
        loc: 'https://zgrad.gg/connect/us1',
        changefreq: 'monthly',
        priority: '0.5'
      },
      {
        loc: 'https://zgrad.gg/connect/us2',
        changefreq: 'monthly',
        priority: '0.5'
      },
      {
        loc: 'https://zgrad.gg/connect/us3',
        changefreq: 'monthly',
        priority: '0.5'
      },
      {
        loc: 'https://zgrad.gg/connect/us4',
        changefreq: 'monthly',
        priority: '0.5'
      }
    ];

    // Generate sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add dynamic guide pages from database
    guides.forEach(guide => {
      const lastmod = new Date(guide.updated_at).toISOString().split('T')[0];
      xml += `
  <url>
    <loc>https://zgrad.gg/guides/${guide.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zgrad.gg/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
}

