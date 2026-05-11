# 🔐 **Google & LinkedIn OAuth Production Setup Guide**

## 🟦 **GOOGLE OAUTH SETUP** 

### **1.1 Go to Google Cloud Console**
```
🌐 https://console.cloud.google.com/
```

### **1.2 Create/Select Project**
1. **Create New Project** or select existing
2. **Project Name**: `CV Builder Production`
3. **Project ID**: Note this for later

### **1.3 Enable APIs**
1. Go to **APIs & Services > Library**
2. Search and enable:
   - **Google+ API** 
   - **Google OAuth2 API**

### **1.4 Configure OAuth Consent Screen**
1. Go to **APIs & Services > OAuth consent screen**
2. **User Type**: External
3. **App Information**:
   - **App name**: `CV Builder CV Builder`
   - **User support email**: `admin@example.com`
   - **App logo**: Upload CV Builder logo (optional)
   - **App domain**: `http://localhost:3000` (for dev) or your production domain
   - **Developer contact**: `admin@example.com`

### **1.5 Create OAuth Credentials**
1. Go to **APIs & Services > Credentials**
2. **Create Credentials > OAuth 2.0 Client IDs**
3. **Application type**: Web application
4. **Name**: `CV Builder OAuth Client`
5. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   https://www.okbuddy.io/api/auth/google/callback
   ```
6. **Click Create**
7. **Copy Client ID and Client Secret**

---

## 🔗 **LINKEDIN OAUTH SETUP**

### **2.1 Go to LinkedIn Developer Portal**
```
🌐 https://www.linkedin.com/developers/apps
```

### **2.2 Create New App**
1. **Click "Create app"**
2. **App name**: `CV Builder CV Builder`
3. **LinkedIn Page**: Create or select a company page
4. **App logo**: Upload CV Builder logo
5. **Legal agreement**: Accept terms

### **2.3 Configure OAuth Settings**
1. Go to **Auth tab**
2. **OAuth 2.0 redirect URLs**:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   https://www.okbuddy.io/api/auth/linkedin/callback
   ```
3. **OAuth 2.0 scopes**: Request these permissions:
   - `r_liteprofile` (Basic profile info)
   - `r_emailaddress` (Email address)

### **2.4 Get Credentials**
1. **Client ID**: Copy from Auth tab
2. **Client Secret**: Copy from Auth tab

---

## ⚙️ **ENVIRONMENT CONFIGURATION**

Update your `.env.local` with real credentials:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-real-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-real-google-client-secret"

# LinkedIn OAuth  
LINKEDIN_CLIENT_ID="your-real-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-real-linkedin-client-secret"

# OAuth Redirect URIs
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/auth/linkedin/callback"
```

---

## 🧪 **TESTING OAUTH FLOWS**

### **Test Google OAuth:**
1. Go to `http://localhost:3000/login`
2. Click "Continue with Google" button
3. Should redirect to Google authorization
4. After consent, should redirect back with session

### **Test LinkedIn OAuth:**
1. Go to `http://localhost:3000/login`  
2. Click "Continue with LinkedIn" button
3. Should redirect to LinkedIn authorization
4. After consent, should redirect back with session

---

## 🚨 **PRODUCTION CHECKLIST**

- [ ] Google OAuth app verified (if needed for production)
- [ ] LinkedIn app approved (if needed for production)
- [ ] Production domain added to redirect URIs
- [ ] Environment variables set in production hosting
- [ ] SSL/HTTPS enabled for production OAuth
- [ ] Test OAuth flows end-to-end in production
