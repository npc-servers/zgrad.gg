// Discord OAuth login initiation for Cloudflare Pages
export async function onRequest(context) {
  const { env } = context;
  const url = new URL(context.request.url);

  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', env.DISCORD_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify guilds guilds.members.read');

  return Response.redirect(authUrl.toString(), 302);
}




