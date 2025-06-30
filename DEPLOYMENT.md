# 🚀 Vercel Deployment Guide

This guide will help you deploy your Apartment Rental Platform to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Node.js**: Version 18 or higher
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## 🛠️ Quick Deployment

### Method 1: Using the Deployment Script (Recommended)

1. **Run the deployment script:**
   ```bash
   npm run deploy
   ```

2. **Follow the prompts:**
   - Login to Vercel if not already logged in
   - Choose between preview or production deployment
   - Wait for the deployment to complete

### Method 2: Manual Deployment

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # For preview deployment
   vercel

   # For production deployment
   vercel --prod
   ```

### Method 3: Git Integration (Easiest)

1. **Connect your repository:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Vercel will automatically detect it's a Vite project

2. **Configure build settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

## ⚙️ Environment Variables Setup

### Required Variables

Set these in your Vercel project dashboard (Settings > Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk authentication key | `pk_live_...` |
| `VITE_API_URL` | Backend API URL | `https://your-api.vercel.app/api` |

### Steps to Add Environment Variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - **Name**: Variable name (e.g., `VITE_CLERK_PUBLISHABLE_KEY`)
   - **Value**: Variable value
   - **Environment**: Select `Production`, `Preview`, and `Development`
4. Click **Save**

## 🔧 Configuration Files

### vercel.json
The `vercel.json` file is already configured with:
- Static build configuration
- SPA routing support
- Asset caching headers
- Environment variable references

### package.json Scripts
New scripts added:
- `npm run deploy` - Interactive deployment script
- `npm run deploy:prod` - Direct production deployment
- `npm run deploy:preview` - Preview deployment
- `npm run vercel-build` - Build command for Vercel

## 🌐 Custom Domain (Optional)

1. **Add domain in Vercel:**
   - Go to your project dashboard
   - Navigate to **Settings** > **Domains**
   - Add your custom domain

2. **Configure DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A record pointing to Vercel's IP

## 📊 Monitoring and Analytics

### Built-in Vercel Analytics
- Automatically enabled for all deployments
- View in your Vercel dashboard under **Analytics**

### Optional: Add Custom Analytics
Add to your environment variables:
```
VITE_ANALYTICS_ID=your_google_analytics_id
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check that all dependencies are in `package.json`
   - Ensure no TypeScript errors locally
   - Verify environment variables are set

2. **404 on Refresh:**
   - The `vercel.json` should handle SPA routing
   - Ensure the routing configuration is correct

3. **Environment Variables Not Working:**
   - Variables must start with `VITE_` for Vite
   - Check they're set in the correct environment
   - Redeploy after adding variables

4. **Clerk Authentication Issues:**
   - Verify the publishable key is correct
   - Check Clerk dashboard for domain configuration
   - Ensure production keys are used for production

### Debug Commands:
```bash
# Check Vercel CLI version
vercel --version

# List your deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Check project settings
vercel env ls
```

## 🚀 Deployment Checklist

- [ ] Code is committed to Git repository
- [ ] All dependencies are in `package.json`
- [ ] Build runs successfully locally (`npm run build`)
- [ ] Environment variables are configured in Vercel
- [ ] Clerk is configured for production domain
- [ ] Backend API is deployed and accessible
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] All functionality tested on live site

## 📱 Post-Deployment

1. **Test the live site:**
   - User registration/login
   - Apartment search and listing
   - Booking functionality
   - Responsive design on mobile

2. **Monitor performance:**
   - Check Vercel Analytics
   - Monitor error rates
   - Test loading speeds

3. **Set up alerts:**
   - Configure Vercel notifications
   - Set up uptime monitoring

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Clerk Production Setup](https://clerk.com/docs/deployments/overview)
- [React Router on Vercel](https://vercel.com/guides/deploying-react-with-vercel)

---

**Need help?** Check the [Vercel Community](https://github.com/vercel/vercel/discussions) or [contact support](https://vercel.com/support).
