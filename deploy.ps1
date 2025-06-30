# Apartment Rental Platform - Vercel Deployment Script
# ====================================================

Write-Host "🚀 Starting Vercel Deployment for Apartment Rental Platform" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI installation..." -ForegroundColor Yellow
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
$vercelAuth = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Please login..." -ForegroundColor Red
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to login to Vercel" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Logged in to Vercel as: $vercelAuth" -ForegroundColor Green
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Cleaned dist directory" -ForegroundColor Green
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cleaned build cache" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Run tests (if any)
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm run test --if-present
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Tests failed, but continuing deployment..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Tests passed" -ForegroundColor Green
}

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Check if .env file exists and warn about environment variables
Write-Host "🔧 Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "⚠️ Found .env file. Make sure to set environment variables in Vercel dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Go to your Vercel project dashboard" -ForegroundColor Cyan
    Write-Host "   2. Navigate to Settings > Environment Variables" -ForegroundColor Cyan
    Write-Host "   3. Add the following variables:" -ForegroundColor Cyan
    
    $envContent = Get-Content ".env"
    foreach ($line in $envContent) {
        if ($line -match "^VITE_" -and $line -notmatch "^#") {
            $varName = ($line -split "=")[0]
            Write-Host "      - $varName" -ForegroundColor White
        }
    }
} else {
    Write-Host "⚠️ No .env file found. Make sure to set environment variables in Vercel dashboard" -ForegroundColor Yellow
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Choose deployment type:" -ForegroundColor Cyan
Write-Host "1. Preview deployment (default)" -ForegroundColor White
Write-Host "2. Production deployment" -ForegroundColor White

$choice = Read-Host "Enter your choice (1 or 2)"

if ($choice -eq "2") {
    Write-Host "🌟 Deploying to production..." -ForegroundColor Green
    vercel --prod
} else {
    Write-Host "🔍 Deploying preview..." -ForegroundColor Green
    vercel
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🎉 Your apartment rental platform is now live on Vercel!" -ForegroundColor Green

# Get deployment URL
Write-Host "🔗 Getting deployment URL..." -ForegroundColor Yellow
$deploymentInfo = vercel ls --limit 1 2>&1
Write-Host "📱 You can view your deployment at the URL shown above" -ForegroundColor Cyan

Write-Host "============================================================" -ForegroundColor Green
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set up environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Configure custom domain (optional)" -ForegroundColor White
Write-Host "3. Set up monitoring and analytics" -ForegroundColor White
Write-Host "4. Test all functionality on the live site" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
