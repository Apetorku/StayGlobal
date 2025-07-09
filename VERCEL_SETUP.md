# 🚀 Vercel Environment Variables Setup

## ❌ Current Error
```
@clerk/clerk-react: The publishableKey passed to Clerk is invalid
(key=pk_live_your_production_clerk_key_here)
```

This error occurs because the environment variables are not set in Vercel.

## ✅ Solution: Set Environment Variables

### Step 1: Get Your Clerk Publishable Key

1. **Visit Clerk Dashboard**: https://dashboard.clerk.com
2. **Go to API Keys**: Navigate to your project → Settings → API Keys
3. **Copy Publishable Key**: Should look like `pk_live_...` or `pk_test_...`

### Step 2: Set Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your StayGlobal project**
3. **Navigate to**: Settings → Environment Variables
4. **Add these variables**:

#### Required Variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Your actual Clerk key | Production, Preview, Development |
| `VITE_API_URL` | Your backend URL | Production, Preview, Development |

#### Example Values:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZXhhbXBsZS5jb20k
VITE_API_URL=https://your-backend.vercel.app/api
```

### Step 3: Redeploy

After setting environment variables:

1. **Go to Deployments** tab
2. **Click three dots** on latest deployment
3. **Select "Redeploy"**

Or push a new commit to trigger redeployment.

## 🔍 Verification

After redeployment, your app should:
- ✅ Load without white screen
- ✅ Show Clerk authentication
- ✅ No console errors

## 🆘 Troubleshooting

### If still getting errors:

1. **Check environment variables are set correctly**
2. **Ensure you selected all environments** (Production, Preview, Development)
3. **Verify Clerk key format** (should start with `pk_live_` or `pk_test_`)
4. **Check Clerk dashboard** for any domain restrictions

### Common Issues:

- **Wrong key format**: Make sure it's the publishable key, not secret key
- **Domain restrictions**: Check Clerk settings for allowed domains
- **Cache issues**: Try hard refresh (Ctrl+F5) after redeployment

## 📞 Need Help?

- **Clerk Documentation**: https://clerk.com/docs
- **Vercel Documentation**: https://vercel.com/docs/concepts/projects/environment-variables
- **GitHub Issues**: Create an issue in your repository
