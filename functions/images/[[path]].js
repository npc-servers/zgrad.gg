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

    // Detect development mode
    const isDevMode = request.url.includes('localhost') || request.url.includes('127.0.0.1');

    // Development mode - try D1 local storage first
    if (isDevMode) {
      // Extract filename from path (e.g., 'guides/abc123.png' -> 'abc123.png')
      const filename = path.split('/').pop();
      
      if (filename && path.startsWith('guides/')) {
        const image = await env.DB.prepare(
          'SELECT content_type, data FROM local_images WHERE filename = ?'
        ).bind(filename).first();
        
        if (image) {
          // Decode base64 data back to binary
          const binaryString = atob(image.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Found in D1, serve it
          return new Response(bytes, {
            headers: {
              'Content-Type': image.content_type || 'image/png',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    }
    // Production mode - try R2
    else if (env.R2_BUCKET) {
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
    }

    // Not in R2 or D1, try static files
    return env.ASSETS.fetch(request);

  } catch (error) {
    console.error('Error serving image:', error);
    // Fall back to static on any error
    return env.ASSETS.fetch(request);
  }
}

