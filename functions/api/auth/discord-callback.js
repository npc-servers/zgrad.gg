// Discord OAuth callback handler for Cloudflare Pages
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

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
      `https://discord.com/api/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!guildMemberResponse.ok) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/cms/login.html' }
      });
    }

    const guildMemberData = await guildMemberResponse.json();

    // Check if user has required role
    const requiredRoles = env.DISCORD_REQUIRED_ROLES.split(',');
    const hasRequiredRole = guildMemberData.roles.some(role =>
      requiredRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/cms/login.html' }
      });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in D1 database
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, username, discriminator, avatar, access_token, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        sessionId,
        userData.id,
        userData.username,
        userData.discriminator || '0',
        userData.avatar,
        access_token,
        refresh_token,
        expiresAt,
        Date.now()
      )
      .run();

    // Set session cookie and redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/cms',
        'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      }
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}




