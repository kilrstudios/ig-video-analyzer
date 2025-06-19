# Railway Deployment Setup Guide

This guide will help you configure environment variables in Railway to fix build failures and ensure proper deployment.

## Environment Variables Required

### 🔐 **Supabase Configuration (Required)**

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://ndegjkqkerrltuemgydk.supabase.co`
   - Description: Your Supabase project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA`
   - Description: Supabase anonymous key for client-side operations

3. **SUPABASE_SERVICE_ROLE_KEY** (Optional for admin operations)
   - Get this from your Supabase project settings
   - Used for server-side operations that require elevated permissions

### 💳 **Stripe Configuration (Required for Payments)**

4. **STRIPE_SECRET_KEY**
   - Get from: Stripe Dashboard → Developers → API Keys
   - Example: `sk_test_...` (test) or `sk_live_...` (production)
   - Description: Server-side Stripe secret key

5. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - Get from: Stripe Dashboard → Developers → API Keys
   - Example: `pk_test_...` (test) or `pk_live_...` (production)
   - Description: Client-side Stripe publishable key

6. **STRIPE_WEBHOOK_SECRET**
   - Get from: Stripe Dashboard → Developers → Webhooks
   - Example: `whsec_...`
   - Description: Webhook endpoint secret for signature verification

### 🤖 **OpenAI Configuration (Required for Analysis)**

7. **OPENAI_API_KEY**
   - Get from: OpenAI Platform → API Keys
   - Example: `sk-proj-...`
   - Description: OpenAI API key for video analysis

### 🌍 **App Configuration**

8. **NEXT_PUBLIC_BASE_URL**
   - Value: `https://your-app-name.up.railway.app`
   - Description: Your Railway app URL (replace with actual URL)

9. **NODE_ENV**
   - Value: `production`
   - Description: Environment mode

## How to Set Environment Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click on your service (ig-video-analyzer)
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add each environment variable one by one:
   - Name: (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: (the corresponding value from above)
   - Click **"Add"**

### Method 2: Railway CLI

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://ndegjkqkerrltuemgydk.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWdqa3FrZXJybHR1ZW1neWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDU0NTYsImV4cCI6MjA2NTM4MTQ1Nn0.nryVTYXw0gOVjJQMMCfUW6pcVlRgMiLzJYQ2gBkZAHA
railway variables set OPENAI_API_KEY=your_openai_api_key_here
railway variables set STRIPE_SECRET_KEY=your_stripe_secret_key_here
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
railway variables set STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
railway variables set NEXT_PUBLIC_BASE_URL=https://your-app-name.up.railway.app
railway variables set NODE_ENV=production
```

## Verification Steps

### 1. Check Variables Are Set

In Railway dashboard:
1. Go to Variables tab
2. Verify all required variables are listed
3. Ensure no values show as "undefined" or empty

### 2. Trigger New Deployment

After setting variables:
1. Go to **"Deployments"** tab
2. Click **"Deploy Latest"** or push a new commit to trigger rebuild
3. Monitor build logs for success

### 3. Test Application

Once deployed:
1. Visit your Railway app URL
2. Test video analysis functionality
3. Test token purchasing (if Stripe is configured)
4. Check browser console for any errors

## Troubleshooting

### Build Still Failing?

1. **Check for typos** in environment variable names
2. **Verify all NEXT_PUBLIC_** variables are set (required for client-side)
3. **Ensure no trailing spaces** in variable values
4. **Check Railway logs** for specific error messages

### Common Issues

1. **"Could not find NEXT_PUBLIC_SUPABASE_URL"**
   - Set `NEXT_PUBLIC_SUPABASE_URL` in Railway variables
   - Must include `NEXT_PUBLIC_` prefix

2. **"Neither apiKey nor config.authenticator provided"**
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Railway variables
   - Verify the key is correct and not truncated

3. **Stripe errors**
   - Ensure all Stripe keys are set
   - Check that webhook URL is configured in Stripe dashboard

## Security Notes

- ✅ **NEXT_PUBLIC_** variables are safe to expose (client-side)
- ❌ **Never expose** secret keys like `STRIPE_SECRET_KEY` with `NEXT_PUBLIC_` prefix
- 🔒 Railway automatically encrypts and secures environment variables
- 🔄 Remember to update webhook URLs in Stripe dashboard to point to your Railway domain

## Quick Copy-Paste Checklist

Copy these exact variable names into Railway:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
✅ OPENAI_API_KEY
✅ STRIPE_SECRET_KEY
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ NEXT_PUBLIC_BASE_URL
✅ NODE_ENV
```

---

After setting all variables, your app should build and deploy successfully! 🚀 