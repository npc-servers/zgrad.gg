# PowerShell setup script for local development environment

Write-Host "🚀 Setting up ZGRAD CMS local development environment..." -ForegroundColor Cyan
Write-Host ""

# Check if wrangler is installed
$wranglerInstalled = Get-Command wrangler -ErrorAction SilentlyContinue
if (-not $wranglerInstalled) {
    Write-Host "❌ Wrangler CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g wrangler
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "🗄️  Setting up local D1 database..." -ForegroundColor Cyan
npx wrangler d1 execute zgrad-cms --local --file=./schema.sql

Write-Host ""
Write-Host "🖼️  Setting up local image storage..." -ForegroundColor Cyan
npx wrangler d1 execute zgrad-cms --local --file=./migrations/add-local-images.sql

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy .dev.vars.example to .dev.vars (if it exists) and fill in your Discord OAuth credentials"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host ""
Write-Host "💡 Image uploads will now persist locally in your D1 database!" -ForegroundColor Green

