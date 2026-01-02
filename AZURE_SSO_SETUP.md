# Azure AD Single Sign-On Setup Guide

## Overview
This application now supports Microsoft Azure AD Single Sign-On (SSO) authentication alongside the traditional email/password login.

## Prerequisites
You mentioned you already have:
- Azure AD App Registration created
- Tenant ID
- Client ID
- Client Secret (Note: For SPA applications, you typically don't need the secret)

## Configuration Steps

### 1. Update Environment Variables
Open the `.env` file and replace the placeholder values with your actual Azure AD credentials:

```env
REACT_APP_AZURE_AD_CLIENT_ID=your-actual-client-id
REACT_APP_AZURE_AD_TENANT_ID=your-actual-tenant-id
REACT_APP_AZURE_AD_REDIRECT_URI=http://localhost:3000
```

### 2. Configure Azure AD App Registration
In the Azure Portal, ensure your App Registration has the following settings:

#### Authentication Settings:
1. Go to **Azure Portal** → **Azure Active Directory** → **App Registrations** → Your App
2. Navigate to **Authentication**
3. Add the following **Redirect URIs** under "Single-page application":
   - `http://localhost:3000` (for local development)
   - Your production URL (e.g., `https://your-app.azurewebsites.net`)
4. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit and hybrid flows)

#### API Permissions:
1. Navigate to **API Permissions**
2. Ensure the following permissions are granted:
   - `User.Read` (Microsoft Graph) - Delegated

### 3. Testing the Setup

#### Local Development:
1. Start the development server:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000/login`

3. Click the "Sign in with Microsoft" button

4. You'll be redirected to Microsoft's login page

5. After successful authentication, you'll be redirected back to your application

### 4. Production Deployment
When deploying to production (Azure Static Web Apps):

1. Update the `.env` file or configure environment variables in Azure:
   ```env
   REACT_APP_AZURE_AD_CLIENT_ID=your-actual-client-id
   REACT_APP_AZURE_AD_TENANT_ID=your-actual-tenant-id
   REACT_APP_AZURE_AD_REDIRECT_URI=https://your-production-url.azurewebsites.net
   ```

2. Add the production URL to your Azure AD App Registration redirect URIs

## Features Implemented

### Dual Authentication Support
- ✅ Traditional email/password login (existing)
- ✅ Microsoft Azure AD SSO (new)

### Updated Components
1. **AuthContext** (`src/context/AuthContext.jsx`)
   - Integrated MSAL hooks
   - Supports both authentication types
   - Handles Azure AD logout

2. **Login Page** (`src/pages/Login/Login.jsx`)
   - Added "Sign in with Microsoft" button
   - Popup-based Azure AD authentication

3. **MSAL Provider** (`src/index.js`)
   - Wrapped application with MsalProvider

4. **Configuration** (`src/config/authConfig.js`)
   - Centralized Azure AD configuration
   - Login request scopes

## How It Works

### Login Flow:
1. User clicks "Sign in with Microsoft"
2. Popup window opens with Microsoft login
3. User authenticates with their Microsoft credentials
4. Azure AD returns access token and user info
5. Application stores authentication state
6. User is redirected to the home page

### User Information:
The application extracts:
- Email (username from Azure AD)
- Name
- Profile information

### Logout Flow:
When a user authenticated via Azure AD logs out:
1. Traditional session data is cleared
2. Azure AD logout popup is triggered
3. User is signed out from both the app and Azure AD

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**
   - Ensure the redirect URI in `.env` matches exactly what's configured in Azure AD
   - Check for trailing slashes - they must match

2. **"AADSTS50011: The reply URL specified in the request does not match"**
   - Verify the redirect URI is added under "Single-page application" platform type
   - Not under "Web" platform

3. **Popup blocked**
   - Ensure popup blockers are disabled for your application
   - Alternatively, switch to redirect-based flow (requires code changes)

4. **Token not appearing in local storage**
   - MSAL stores tokens in localStorage by default
   - Check browser console for MSAL-specific errors

## Security Considerations

1. **Client Secret**: For Single Page Applications (SPAs), the client secret is not required and should not be exposed in frontend code
2. **Token Storage**: Tokens are stored in localStorage (configurable in `authConfig.js`)
3. **HTTPS Required**: In production, always use HTTPS
4. **CORS**: Ensure your backend API accepts requests from your frontend domain

## Next Steps

1. Replace placeholder values in `.env` with your actual Azure AD credentials
2. Test the login flow locally
3. Configure production environment variables
4. Update Azure AD redirect URIs for production
5. Consider implementing refresh token rotation for enhanced security

## Support Resources
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [MSAL React Tutorial](https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react)
