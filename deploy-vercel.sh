#!/bin/bash

# Vercel Deployment Script for StoryMagic
# This script helps prepare and deploy the application to Vercel

echo "🚀 StoryMagic Vercel Deployment Script"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://mpmbduoffaldnkhrkxxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE

# Feature Flags
VITE_GOOGLE_AUTH_ENABLED=false
EOF
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check your deployment URL"
echo "2. Test the application functionality"
echo "3. Configure custom domain if needed"
echo "4. Set up monitoring and analytics"
echo ""
echo "🔧 Architecture Notes:"
echo "- Frontend: Deployed on Vercel"
echo "- Backend: Supabase Edge Functions (already deployed)"
echo "- Database: Supabase PostgreSQL"
echo "- Storage: Supabase Storage"
echo ""
echo "📚 For detailed instructions, see: VERCEL_DEPLOYMENT.md" 