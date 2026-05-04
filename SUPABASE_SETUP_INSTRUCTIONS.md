# 🚀 **Supabase User Credentials Setup Guide**

Complete setup instructions for implementing multi-authentication user credentials system in Supabase.

---

## 📋 **Overview**

This guide will help you set up a robust user credentials system that supports:
- ✅ **Email/Password Registration**
- ✅ **Google OAuth Login**
- ✅ **LinkedIn OAuth Login**
- ✅ **Multi-provider account linking**
- ✅ **Security audit logging**
- ✅ **Row Level Security (RLS)**

---

## 🛠️ **Step-by-Step Setup**

### **1. Supabase Project Setup**

#### **Create New Project** (if needed)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Choose your organization
4. Enter project details:
   - **Name**: `okbuddy-production` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click **"Create new project"**

#### **Get Your Credentials**
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values for your `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="your-project-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

---

### **2. Database Schema Setup**

#### **Option A: Fresh Installation** (Recommended for new projects)
1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the entire contents of `supabase-user-credentials-schema.sql`
4. Click **"Run"** to execute
5. Verify all tables were created successfully

#### **Option B: Migration from Existing Schema**
1. **⚠️ BACKUP YOUR DATABASE FIRST!**
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the contents of `migration-from-current-schema.sql`
4. Review the migration script carefully
5. Click **"Run"** to execute
6. Verify migration completed successfully

---

### **3. Environment Variables Setup**

Add these to your `.env.local` file:

```bash
# ====================
# SUPABASE CONFIGURATION
# ====================
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ====================
# OAUTH PROVIDERS
# ====================
# LinkedIn OAuth (Already configured)
LINKEDIN_CLIENT_ID="86nk5co06976t5"
LINKEDIN_CLIENT_SECRET="WPL_AP1.NUO9OJbl6poNNfNU.tmRKYA=="
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/auth/linkedin/callback"

# Google OAuth (Add when ready)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# ====================
# APPLICATION SECURITY
# ====================
JWT_SECRET="your-jwt-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

### **4. Database Table Structure**

Your database will have these tables:

#### **🔑 Main Tables**
- **`users`** - Main user accounts
- **`user_oauth_providers`** - OAuth provider links (Google, LinkedIn)
- **`oauth_sessions`** - Temporary OAuth flow sessions

#### **🛡️ Security Tables**
- **`security_audit_log`** - Security events log
- **`account_linking_attempts`** - Account linking monitoring

#### **📊 Additional Tables** (from your existing schema)
- **`cv_drafts`** - CV draft storage
- **`cv_workflow`** - Enhanced CV workflow
- **`user_sessions`** - User session management
- **`audit_logs`** - General audit logging

---

### **5. Row Level Security (RLS) Configuration**

The schema automatically configures RLS policies that:

✅ **Users can only access their own data**
✅ **Service role can perform backend operations**
✅ **OAuth operations are properly secured**
✅ **Audit logs are protected but readable by users**

---

### **6. Testing Your Setup**

#### **Test Database Connection**
```sql
-- Run this in Supabase SQL Editor to verify setup
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

#### **Test User Creation**
```sql
-- Test creating a user (run in SQL Editor)
INSERT INTO users (email, full_name, signup_method, email_verified)
VALUES ('test@example.com', 'Test User', 'email', true);

-- Verify user was created
SELECT * FROM users WHERE email = 'test@example.com';
```

#### **Test OAuth Provider Linking**
```sql
-- Test creating an OAuth provider link
INSERT INTO user_oauth_providers (
    user_id, 
    provider, 
    provider_user_id, 
    provider_email, 
    is_primary
)
VALUES (
    (SELECT id FROM users WHERE email = 'test@example.com'),
    'linkedin',
    'linkedin-user-123',
    'test@example.com',
    true
);

-- Verify OAuth provider was linked
SELECT * FROM user_oauth_providers;
```

---

### **7. Production Considerations**

#### **🔒 Security Checklist**
- [ ] Enable RLS on all tables
- [ ] Remove test/sample data
- [ ] Configure proper OAuth redirect URIs for production
- [ ] Set up database backups
- [ ] Configure monitoring and alerting

#### **⚡ Performance Optimizations**
- [ ] All necessary indexes are created
- [ ] Regular cleanup of expired OAuth sessions
- [ ] Monitor query performance
- [ ] Consider connection pooling

#### **🧹 Cleanup Tasks**
```sql
-- Schedule this to run periodically
SELECT cleanup_expired_oauth_sessions();

-- Remove old audit logs (optional)
DELETE FROM security_audit_log 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

### **8. OAuth Provider Configuration**

#### **LinkedIn OAuth Setup**
✅ **Already configured** with your credentials:
- Client ID: `86nk5co06976t5`
- Redirect URI: `http://localhost:3000/api/auth/linkedin/callback`

#### **Google OAuth Setup** (When ready)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Add credentials to your `.env.local`

---

### **9. Common Issues & Solutions**

#### **🚨 RLS Policy Issues**
**Problem**: Users can't be created through OAuth
**Solution**: Ensure service role is being used for user creation

#### **🔑 Authentication Errors**
**Problem**: OAuth callback fails
**Solution**: Verify redirect URIs match exactly in provider settings

#### **📊 Performance Issues**
**Problem**: Slow queries
**Solution**: Ensure all indexes are created properly

---

### **10. Verification Commands**

After setup, run these to verify everything works:

```bash
# Test server with new database
./stop-server
./start-server

# Test LinkedIn OAuth endpoint
curl -I "http://localhost:3000/api/auth/linkedin/signin/"

# Should return 307 redirect to LinkedIn
```

---

## ✅ **Setup Complete!**

Your Supabase database is now configured with:

- 🔐 **Multi-authentication support** (Email, Google, LinkedIn)
- 🛡️ **Row Level Security** for data protection
- 📊 **Comprehensive audit logging** for security monitoring
- ⚡ **Optimized performance** with proper indexing
- 🔄 **Automatic cleanup** of expired sessions
- 🧪 **Test data** for development (remove in production)

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Verify environment variables are set correctly
3. Ensure OAuth provider settings match
4. Review RLS policies if data access issues occur

Your LinkedIn OAuth integration is ready to test! 🎉