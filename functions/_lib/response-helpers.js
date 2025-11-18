/**
 * Response helper functions for consistent API responses
 */

/**
 * Create a JSON response
 * @param {Object} data - Data to send
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

/**
 * Create an HTML response
 * @param {string} html - HTML content
 * @param {number} status - HTTP status code
 * @param {Object} extraHeaders - Additional headers
 * @returns {Response}
 */
export function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...extraHeaders,
    },
  });
}

/**
 * Create a redirect response
 * @param {string} location - URL to redirect to
 * @param {number} status - HTTP status code (302 or 301)
 * @returns {Response}
 */
export function redirectResponse(location, status = 302) {
  return new Response(null, {
    status,
    headers: { 'Location': location },
  });
}

