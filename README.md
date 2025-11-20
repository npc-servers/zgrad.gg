# zgrad.gg

Official website for ZGRAD - Premium Homigrad Gaming Network

## Features

- 🎮 Server status and information
- 📝 Content Management System with Discord OAuth
- 🖼️ Image upload and R2 storage integration
- 📚 Dynamic guide system with database-backed content
- ✨ Rich text editor with custom components (Step Cards, Info Boxes, Icons)
- 👥 Multi-user collaboration with contributor tracking
- 📢 **Discord Updates** - Automatic changelog from Discord channel
- ⚡ Hybrid static/dynamic architecture for optimal performance

## Tech Stack

- **Frontend**: Vite + Vanilla JS + CSS3 + TipTap Editor
- **Backend**: Cloudflare Pages Functions (Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Auth**: Discord OAuth 2.0
- **Icons**: Iconify API (200,000+ icons)

## Quick Start

### Prerequisites
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Discord OAuth app credentials

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Discord OAuth credentials

# 3. Initialize local database
npx wrangler d1 execute zgrad-cms --local --file=./schema.sql

# 4. Start dev server
npm run dev
```

Visit `http://localhost:8788`

### Environment Variables

Create `.dev.vars` with:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:8788/api/auth/discord-callback
DISCORD_GUILD_ID=your_guild_id
DISCORD_REQUIRED_ROLES=your_role_id_1,your_role_id_2
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_UPDATES_CHANNEL_ID=your_channel_id
SESSION_SECRET=generate_random_string_here
```

## Development Commands

```bash
npm run dev      # Build + start Wrangler dev server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## CMS Access

1. Visit `/cms`
2. Click "Login with Discord"
3. Authorize with Discord
4. Must be in ZGRAD Discord server with required role

### CMS Features

- **Rich Text Editor** powered by TipTap
- **Custom Components**:
  - Step Cards - numbered steps with titles
  - Info Boxes - highlighted information blocks
  - Icons - 200,000+ icons from Iconify
- **Image Upload** with automatic compression
- **Image Settings** - resize and align images
- **Contributor System** - track all editors
- **Live Preview** - see changes in real-time

## Database Management

### Local Database

```bash
# Run queries
npx wrangler d1 execute zgrad-cms --local --command "SELECT * FROM guides"

# Apply migrations
npx wrangler d1 execute zgrad-cms --local --file=./migration.sql
```

### Remote Database (Production)

```bash
# Run queries
npx wrangler d1 execute zgrad-cms --remote --command "SELECT * FROM guides"

# Apply migrations
npx wrangler d1 execute zgrad-cms --remote --file=./migration.sql
```

## Project Structure

```
├── src/              # Vite entry points
├── js/               # JavaScript modules
│   ├── cms.js        # CMS frontend logic
│   └── tiptap-extensions.js  # Custom TipTap nodes
├── css/              # Stylesheets
├── functions/        # Cloudflare Workers
│   ├── _lib/         # Shared utilities
│   ├── _middleware/  # Auth middleware
│   ├── api/          # API endpoints
│   │   ├── auth/     # Discord OAuth
│   │   ├── guides/   # Guide CRUD operations
│   │   ├── images/   # Image upload
│   │   └── updates/  # Discord updates sync
│   ├── cms/          # CMS routes
│   └── guides/       # Dynamic guide rendering
├── cms/              # CMS HTML and assets
├── guides/           # Static guide templates
├── images/           # Static assets
└── dist/             # Built output (generated)
```

## Discord Updates

Automatically displays Discord messages as a changelog at `/updates/`.

### Setup
1. Create a Discord bot with "Read Messages" permission
2. Add to your server and get bot token
3. Set `DISCORD_BOT_TOKEN` and `DISCORD_UPDATES_CHANNEL_ID` in environment
4. Visit `/updates/` - automatically loads last 50 messages
5. Checks for new messages every 5 minutes

### How It Works
- First visitor triggers auto-sync from Discord
- Messages cached in D1 database for fast loading
- Auto-refreshes every 5 minutes for new updates
- 0-5 minute delay for new messages to appear

## Database Schema

The application uses four main tables:

- **sessions** - Discord OAuth sessions
- **guides** - Published guides with author info
- **guide_contributors** - Track users who edit guides
- **updates** - Cached Discord messages for changelog

See `schema.sql` for full schema definition.

## Image Storage

### Development Mode
- Images are converted to Base64 data URLs
- No persistence between restarts
- Warning displayed in CMS

### Production Mode
- Images uploaded to Cloudflare R2
- Served via CDN
- Permanent storage

## Deployment

### Automatic Deployment
Pushes to `main` branch trigger automatic deployment via Cloudflare Pages.

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

### Environment Setup in Cloudflare

1. Add environment variables in Cloudflare Pages dashboard
2. Set up D1 database binding: `DB` → `zgrad-cms`
3. Set up R2 bucket binding: `R2_BUCKET` → `zgrad-guides-images`

## Troubleshooting

### Database Errors

If you see "table not found" errors, run the database migration:

```bash
npx wrangler d1 execute zgrad-cms --local --file=./schema.sql
```

### Image Upload Issues

**Development Mode**: Images are temporary Base64 data URLs. This is expected behavior without R2 configuration.

**Production Mode**: Ensure R2 bucket is properly bound in `wrangler.toml` and Cloudflare dashboard.

### CMS Access Denied

- Verify Discord OAuth credentials in `.dev.vars`
- Check that you're in the correct Discord server
- Confirm you have the required role ID

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run preview          # Preview production build
npm run generate:guides  # Generate guides manifest
npm run generate:sitemap # Generate sitemap.xml
```

## Contributing

This is a private project for ZGRAD Network. Contributions are limited to authorized team members.

## License

© 2024 ZGRAD Network. All rights reserved.
