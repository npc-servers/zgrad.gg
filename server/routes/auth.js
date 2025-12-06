/**
 * Authentication routes for VPS
 */

import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../lib/database.js';
import { validateSession } from '../middleware/auth.js';
import { 
  secureJsonResponse, 
  errorResponse, 
  checkRateLimit, 
  encryptData 
} from '../lib/security-utils.js';

const router = Router();

/**
 * GET /api/auth/login - Redirect to Discord OAuth
 */
router.get('/login', (req, res) => {
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', process.env.DISCORD_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify guilds guilds.members.read');

  res.redirect(authUrl.toString());
});

/**
 * GET /api/auth/discord-callback - Handle Discord OAuth callback
 */
router.get('/discord-callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    // Get user information
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const userData = await userResponse.json();

    // Check server membership
    const guildMemberResponse = await fetch(
      `https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!guildMemberResponse.ok) {
      return res.redirect('/cms/login.html');
    }

    const guildMemberData = await guildMemberResponse.json();

    // Check if user has required role
    const requiredRoles = process.env.DISCORD_REQUIRED_ROLES?.split(',') || [];
    const hasRequiredRole = guildMemberData.roles.some(role =>
      requiredRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.redirect('/cms/login.html');
    }

    // Clean up old sessions for this user (limit to 3 active sessions)
    const existingSessions = query.prepare(
      'SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userData.id).all();

    if (existingSessions.results && existingSessions.results.length >= 3) {
      const sessionsToDelete = existingSessions.results.slice(2);
      for (const session of sessionsToDelete) {
        query.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run();
      }
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    // Encrypt tokens if encryption key is available
    let encryptedAccessToken = access_token;
    let encryptedRefreshToken = refresh_token;
    
    if (process.env.ENCRYPTION_KEY) {
      try {
        encryptedAccessToken = encryptData(access_token, process.env.ENCRYPTION_KEY);
        if (refresh_token) {
          encryptedRefreshToken = encryptData(refresh_token, process.env.ENCRYPTION_KEY);
        }
      } catch (error) {
        console.error('Token encryption failed:', error);
      }
    }

    // Store session in database
    query.prepare(
      'INSERT INTO sessions (id, user_id, username, discriminator, avatar, access_token, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      sessionId,
      userData.id,
      userData.username,
      userData.discriminator || '0',
      userData.avatar,
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt,
      Date.now()
    ).run();

    // Clean up expired sessions
    query.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();

    // Set session cookie and redirect
    res.cookie('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect('/cms/');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', async (req, res) => {
  // Rate limiting
  const rateLimit = await checkRateLimit(req, 'auth_me', 120, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  // Validate session and verify Discord roles
  const session = await validateSession(req, true);
  
  if (!session) {
    return secureJsonResponse(res, { error: 'Not authenticated' }, 401);
  }

  return secureJsonResponse(res, {
    id: session.user_id,
    username: session.username,
    discriminator: session.discriminator,
    avatar: session.avatar,
  });
});

/**
 * GET /api/auth/logout - Logout user
 */
router.get('/logout', (req, res) => {
  const sessionId = req.cookies?.session_id;

  if (sessionId) {
    query.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  res.clearCookie('session_id', { path: '/' });
  res.redirect('/');
});

export default router;

