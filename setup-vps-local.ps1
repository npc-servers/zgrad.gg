# ZGRAD VPS Server - Local Setup Script (Windows)
# Run this once to set up local development

Write-Host "🚀 ZGRAD VPS Server - Local Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    
    # Create minimal .env for local testing
    $envContent = @"
# Server Configuration
PORT=3000
NODE_ENV=development
SITE_URL=http://localhost:3000

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database (auto-created)
DATABASE_PATH=./server/data/cms.db

# Discord OAuth - Get these from Discord Developer Portal
# https://discord.com/developers/applications
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord-callback
DISCORD_GUILD_ID=
DISCORD_REQUIRED_ROLES=

# Discord Bot (optional for local testing)
# Required intents: Message Content, Guild Messages, Guild Message Reactions
DISCORD_BOT_TOKEN=
DISCORD_UPDATES_CHANNEL_ID=

# Security (generate random strings)
ENCRYPTION_KEY=local-dev-key-change-in-prod123
BUILD_SECRET=local-build-secret

# R2 Storage (optional - will use local storage if not set)
# R2_ACCOUNT_ID=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET_NAME=
# R2_PUBLIC_URL=
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Created .env file - Please edit it with your Discord credentials!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built" -ForegroundColor Green
Write-Host ""

# Initialize database
Write-Host "💾 Initializing database..." -ForegroundColor Yellow
node server/scripts/migrate.js
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env with your Discord OAuth credentials"
Write-Host "2. Run: npm run server:dev"
Write-Host "3. Open: http://localhost:3000"
Write-Host ""
Write-Host "To get Discord credentials:" -ForegroundColor Yellow
Write-Host "  - Go to https://discord.com/developers/applications"
Write-Host "  - Create/select an app"
Write-Host "  - Copy Client ID and Client Secret"
Write-Host "  - Add redirect URI: http://localhost:3000/api/auth/discord-callback"
Write-Host ""

