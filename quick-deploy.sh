#!/bin/bash

# Quick Vercel Deployment Script (Bash version for Linux/Mac)
# ===========================================================

echo "🚀 Quick Vercel Deployment for Apartment Rental Platform"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
echo -e "${YELLOW}📦 Checking Vercel CLI installation...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install Vercel CLI${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Vercel CLI installed successfully${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI is already installed${NC}"
fi

# Check if user is logged in to Vercel
echo -e "${YELLOW}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel. Please login...${NC}"
    vercel login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to login to Vercel${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Logged in to Vercel${NC}"
fi

# Clean and build
echo -e "${YELLOW}🧹 Cleaning and building...${NC}"
rm -rf dist node_modules/.cache
npm ci && npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Deploy
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
echo -e "${CYAN}Choose deployment type:${NC}"
echo "1. Preview deployment (default)"
echo "2. Production deployment"

read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo -e "${GREEN}🌟 Deploying to production...${NC}"
    vercel --prod
else
    echo -e "${GREEN}🔍 Deploying preview...${NC}"
    vercel
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${GREEN}🎉 Your apartment rental platform is now live on Vercel!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
