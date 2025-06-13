# Supabase Setup Guide

## 🚀 Complete User Authentication & Credit System Setup

### **1. Supabase Project Setup**

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `ig-video-analyzer`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

#### Get Project Credentials
1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (anon key section)
   - **Anon Key** (public key)
   - **Service Role Key** (secret key)

### **2. Environment Variables Setup**

Create `.env.local` file in your project root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **3. Database Schema Setup**

#### Option A: SQL Editor (Recommended)
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the entire `supabase/schema.sql` content
3. Run the query to create all tables, functions, and policies

#### Option B: Manual Table Creation
If you prefer creating tables manually:

**Tables to create:**
- `user_profiles` - User profiles with credit balances
- `video_analyses` - Stored video analysis results
- `credit_transactions` - Credit purchase/usage history

**Functions to create:**
- `create_user_profile()` - Auto-create profile on signup
- `deduct_credits()` - Safely deduct credits with validation
- `add_credits()` - Add credits for purchases
- `get_user_analytics()` - User statistics

### **4. Authentication Configuration**

#### Enable Email Authentication
1. Go to **Authentication > Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email templates (optional but recommended)

#### Configure Row Level Security (RLS)
The schema automatically enables RLS policies that ensure:
- Users can only see their own data
- Credit operations are secure
- File access is restricted to owners

### **5. Storage Setup**

#### Create Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `video-files`
3. Set to **Private** (policies will handle access)

The schema automatically creates the necessary storage policies.

### **6. Testing the Setup**

#### Test Authentication
1. Run your Next.js app: `npm run dev`
2. Try signing up with a new account
3. Check if user profile is created automatically
4. Verify 10 free credits are awarded

#### Test Credit System
1. Attempt to analyze a video
2. Check if credits are properly estimated
3. Verify credit deduction after analysis
4. Check if analysis is saved to database

### **7. Features Included**

✅ **User Authentication**: Email-based signup/signin  
✅ **User Profiles**: Automatic profile creation with 10 free credits  
✅ **Credit System**: Purchase, usage tracking, and balance management  
✅ **Analysis Storage**: All analysis results saved to user account  
✅ **File Storage**: Secure video file storage in Supabase  
✅ **Dashboard**: Complete user dashboard with analytics  
✅ **Row Level Security**: Data isolation between users  
✅ **Transaction History**: Full audit trail of credit usage  

### **8. Database Functions Reference**

#### `deduct_credits(user_id, credits_amount)`
- Safely deducts credits with balance validation
- Records transaction in `credit_transactions`
- Returns success status and new balance

#### `add_credits(user_id, credits_amount, description)`
- Adds credits to user account
- Records purchase transaction
- Used for credit purchases

#### `get_user_analytics(user_id)`
- Returns comprehensive user statistics
- Total analyses, credits used, monthly stats
- Used in dashboard analytics

### **9. Security Features**

- **Row Level Security**: Users can only access their own data
- **Secure Functions**: Credit operations use security definer functions
- **Storage Policies**: File access restricted to owners
- **Input Validation**: All database operations validate inputs
- **Audit Trail**: Complete transaction history

### **10. Deployment Considerations**

#### Environment Variables
- Ensure all Supabase keys are set in production
- Use different Supabase projects for dev/staging/production
- Never commit `.env.local` to version control

#### Database Migrations
- Save the `schema.sql` for future deployments
- Consider using Supabase CLI for migration management
- Test schema changes in development first

### **11. Troubleshooting**

#### Common Issues

**"Missing Supabase environment variables"**
- Check `.env.local` file exists and has correct keys
- Verify environment variable names match exactly
- Restart Next.js development server

**"User profile not created"**
- Check if `create_user_profile` trigger is active
- Verify RLS policies allow profile creation
- Check Supabase logs for errors

**"Insufficient credits" error**
- Verify user has enough credits in database
- Check if `deduct_credits` function is working
- Ensure credit calculation is correct

**Authentication not working**
- Verify email provider is enabled in Supabase
- Check browser console for CORS errors
- Ensure correct Supabase URL and keys

### **12. Next Steps**

After setup completion:
1. **Payment Integration**: Add Stripe for credit purchases
2. **Email Templates**: Customize authentication emails
3. **Analytics**: Add user behavior tracking
4. **Admin Panel**: Create admin interface for user management
5. **API Rate Limiting**: Implement rate limiting for API calls

### **Support**

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify environment variables
3. Test database functions directly in SQL editor
4. Check browser console for client-side errors

**Database Schema Location**: `supabase/schema.sql`
**Component Locations**: `src/components/`, `src/contexts/`
**API Integration**: `src/lib/supabase.js` 