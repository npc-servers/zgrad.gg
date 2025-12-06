# ZGRAD CMS - VPS Server

This is the VPS-compatible backend for the ZGRAD CMS, converted from Cloudflare Workers/Pages Functions.

## Architecture Changes

| Cloudflare Service | VPS Replacement |
|-------------------|-----------------|
| D1 (SQLite) | SQLite via better-sqlite3 |
| R2 (Object Storage) | R2 via S3 API (or local fallback) |
| KV (Key-Value) | SQLite tables |
| Workers Functions | Express.js routes |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `server/env.example.txt` to `.env` in the project root:

```bash
cp server/env.example.txt .env
```

Edit `.env` and fill in your Discord OAuth credentials and other settings.

### 3. Initialize Database

```bash
npm run db:migrate
```

### 4. Build Frontend

```bash
npm run build
```

### 5. Start Server

Development (with auto-reload):
```bash
npm run server:dev
```

Production:
```bash
npm start
```

## API Endpoints

All API endpoints remain the same as the Cloudflare version:

### Authentication
- `GET /api/auth/login` - Redirect to Discord OAuth
- `GET /api/auth/discord-callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout

### Guides
- `GET /api/guides/list` - List all guides
- `POST /api/guides/create` - Create a guide
- `GET /api/guides/:id` - Get a guide
- `PUT /api/guides/:id` - Update a guide
- `DELETE /api/guides/:id` - Delete a guide
- `POST /api/guides/build` - Build endpoint for SSG

### News
- `GET /api/news/list` - List all news
- `POST /api/news/create` - Create news article
- `GET /api/news/:id` - Get news article
- `PUT /api/news/:id` - Update news article
- `DELETE /api/news/:id` - Delete news article

### Updates (Real-time Discord Sync)
- `GET /api/updates/list` - List updates
- `GET /api/updates/get-latest` - Get latest update
- `GET /api/updates/status` - Get Discord bot status
- `GET /api/updates/auto-sync` - Legacy (returns bot status)
- `POST /api/updates/refresh` - Legacy (handled by bot now)

### Images
- `POST /api/images/upload` - Upload an image
- `GET /images/guides/:filename` - Serve uploaded images

## Directory Structure

```
server/
├── server.js           # Main Express server
├── lib/
│   ├── database.js     # SQLite database module
│   ├── discord-utils.js
│   ├── html-utils.js
│   └── security-utils.js
├── middleware/
│   └── auth.js         # Authentication middleware
├── routes/
│   ├── auth.js
│   ├── guides.js
│   ├── guides-page.js  # Dynamic guide page serving
│   ├── images.js
│   ├── images-serve.js
│   ├── news.js
│   └── updates.js
├── scripts/
│   └── migrate.js      # Database migration
└── data/
    ├── cms.db          # SQLite database (auto-created)
    └── uploads/        # Image uploads (auto-created)
        └── guides/
```

## Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start npm --name "zgrad-cms" -- start
pm2 save
```

### Using systemd

Create `/etc/systemd/system/zgrad-cms.service`:

```ini
[Unit]
Description=ZGRAD CMS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/zgrad.gg
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable zgrad-cms
sudo systemctl start zgrad-cms
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name zgrad.gg www.zgrad.gg;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Discord Bot (Real-time Updates)

The server includes a Discord bot that listens for messages in real-time. No more polling!

### Features

- **Real-time sync** - New messages appear instantly
- **Edit tracking** - Message edits are reflected immediately
- **Delete handling** - Deleted messages are removed from the database
- **Reaction sync** - Reactions are updated in real-time
- **Initial sync** - On startup, syncs the last 50 messages

### Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (or create one)
3. Go to **Bot** section
4. Enable these **Privileged Gateway Intents**:
   - Message Content Intent
   - Server Members Intent (optional)
5. Copy the bot token to your `.env` as `DISCORD_BOT_TOKEN`

### Required Bot Permissions

When adding the bot to your server, it needs:
- Read Messages/View Channels
- Read Message History
- Add Reactions (to track reactions)

### Environment Variables

```env
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_UPDATES_CHANNEL_ID=channel-id-to-watch
DISCORD_GUILD_ID=your-server-id
```

The bot automatically starts when the server starts. Check status at `/api/updates/status`.

## Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing
3. Go to OAuth2 settings
4. Add redirect URI: `https://your-domain.com/api/auth/discord-callback`
5. Copy Client ID and Client Secret to your `.env` file

## Cloudflare R2 Setup

The server can use Cloudflare R2 for image/video storage (recommended for production).

### 1. Create R2 API Token

1. Go to Cloudflare Dashboard → R2
2. Click "Manage R2 API Tokens"
3. Create a new token with read/write permissions
4. Copy the Access Key ID and Secret Access Key

### 2. Configure Environment

Add to your `.env`:

```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=zgrad-guides-images
R2_PUBLIC_URL=https://images.zgrad.gg
```

### 3. Public Access (Optional)

If you have a custom domain for R2 (like `images.zgrad.gg`), set `R2_PUBLIC_URL`. 
The server will redirect image requests to this URL for better performance.

Without `R2_PUBLIC_URL`, the server will proxy images through itself.

### Local Fallback

If R2 credentials are not configured, images are stored locally in `server/data/uploads/`.
This is useful for development or if you prefer local storage.

## Migrating from Cloudflare

If you have existing data in Cloudflare D1, you can export it and import into SQLite:

```bash
# Export from D1 (on Cloudflare)
wrangler d1 export zgrad-cms --output=backup.sql

# Import to local SQLite
sqlite3 server/data/cms.db < backup.sql
```

For R2 images, download them and place in `server/data/uploads/guides/`.

