#!/bin/bash
# Setup script for local development environment

echo "🚀 Setting up ZGRAD CMS local development environment..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up local D1 database..."
npx wrangler d1 execute zgrad-cms --local --file=./schema.sql

echo ""
echo "🖼️  Setting up local image storage..."
npx wrangler d1 execute zgrad-cms --local --file=./migrations/add-local-images.sql

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy .dev.vars.example to .dev.vars (if it exists) and fill in your Discord OAuth credentials"
echo "2. Run 'npm run dev' to start the development server"
echo ""
echo "💡 Image uploads will now persist locally in your D1 database!"

