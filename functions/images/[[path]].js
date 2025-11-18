// Serve images from R2 bucket
// This handles routes like /images/guides/123.png
// Falls back to static files if not in R2

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get the full path from the URL
    // params.path is an array like ['guides', '123.png']
    const path = params.path ? params.path.join('/') : '';

    if (!path) {
      // No path, serve static
      return env.ASSETS.fetch(request);
    }

    // Try to fetch from R2 first
    const object = await env.R2_BUCKET.get(path);

    if (object) {
      // Found in R2, serve it
      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata.contentType || 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': object.etag,
        },
      });
    }

    // Not in R2, try static files
    return env.ASSETS.fetch(request);

  } catch (error) {
    console.error('Error serving image:', error);
    // Fall back to static on any error
    return env.ASSETS.fetch(request);
  }
}

