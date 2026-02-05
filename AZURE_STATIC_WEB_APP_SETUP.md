# Azure Static Web Apps Deployment with Azure AD SSO

## Problem Fixed
Azure Static Web Apps serve pre-built static files, so `process.env` variables are NOT available at runtime. This was causing the "client_id" error.

## Solution Implemented
The app now loads configuration from `/config.json` at runtime, which can be configured using Azure Static Web Apps' configuration replacement feature.

## Setup Steps for Azure Static Web Apps

### Option 1: Using Application Settings (Simpler - Recommended)

1. **Edit the config.json file** in the `public` folder:
   ```json
   {
     "azureAd": {
       "clientId": "YOUR_ACTUAL_CLIENT_ID_HERE",
       "tenantId": "YOUR_ACTUAL_TENANT_ID_HERE",
       "redirectUri": "https://your-static-app-url.azurestaticapps.net"
     }
   }
   ```

2. **Rebuild your app**:
   ```bash
   npm run build
   ```

3. **Redeploy to Azure Static Web Apps**

### Option 2: Using Environment Variables at Build Time

1. **In Azure Portal**, go to your Static Web App → **Configuration** → **Application settings**

2. **Add these settings** (they will be injected during build):
   - Key: `REACT_APP_AZURE_AD_CLIENT_ID` → Value: `your-client-id`
   - Key: `REACT_APP_AZURE_AD_TENANT_ID` → Value: `your-tenant-id`
   - Key: `REACT_APP_AZURE_AD_REDIRECT_URI` → Value: `https://your-app.azurestaticapps.net`

3. **Trigger a rebuild** (push to GitHub or redeploy)

### Option 3: Using GitHub Actions Secrets (Most Secure)

1. **In your GitHub repository**, go to **Settings** → **Secrets and variables** → **Actions**

2. **Add these secrets**:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_TENANT_ID`
   - `AZURE_AD_REDIRECT_URI`

3. **Update your GitHub Actions workflow** (`azure-pipelines.yml` or `.github/workflows/...`):
   ```yaml
   - name: Build And Deploy
     env:
       REACT_APP_AZURE_AD_CLIENT_ID: ${{ secrets.AZURE_AD_CLIENT_ID }}
       REACT_APP_AZURE_AD_TENANT_ID: ${{ secrets.AZURE_AD_TENANT_ID }}
       REACT_APP_AZURE_AD_REDIRECT_URI: ${{ secrets.AZURE_AD_REDIRECT_URI }}
     uses: Azure/static-web-apps-deploy@v1
     # ... rest of your config
   ```

## Azure AD App Registration Configuration

Make sure your Azure AD App has these settings:

1. **Platform Configuration**:
   - Type: **Single-page application (SPA)**
   - Redirect URIs: Add your Static Web App URL
     - Example: `https://nice-stone-0123456789.azurestaticapps.net`

2. **Supported account types**:
   - Choose based on your needs (usually "Accounts in this organizational directory only")

3. **Implicit grant and hybrid flows**:
   - ✅ **Access tokens** (for implicit flows)
   - ✅ **ID tokens** (for implicit and hybrid flows)

## Testing

1. After deployment, open your app
2. Open browser console (F12)
3. Look for these logs:
   ```
   🔧 MSAL Configuration loaded
   Client ID: 12345678...
   Authority: https://login.microsoftonline.com/...
   Redirect URI: https://...
   ```

4. If you see "MISSING ❌" next to Client ID, the configuration didn't load properly

## Troubleshooting

### Still getting "client_id" error?
- Clear browser cache
- Check browser console for configuration logs
- Verify `/config.json` is accessible: `https://your-app.azurestaticapps.net/config.json`

### Config not loading?
1. Make sure `config.json` is in the `public` folder
2. Rebuild: `npm run build`
3. Check that `build/config.json` exists
4. Redeploy

### Authentication popup not working?
- Verify redirect URI in Azure AD matches your Static Web App URL exactly
- Check for mixed http/https issues
- Ensure SPA platform is configured (not Web)

## Files Modified

1. `public/config.json` - Runtime configuration file
2. `public/staticwebapp.config.json` - Added environment variables section
3. `src/config/runtimeConfig.js` - New runtime config loader
4. `src/config/authConfig.js` - Updated to use runtime config
5. `src/index.js` - Updated MSAL initialization

## Quick Fix Checklist

- [ ] Update `public/config.json` with your actual values
- [ ] Rebuild: `npm run build`
- [ ] Verify Azure AD redirect URI matches your Static Web App URL
- [ ] Ensure Azure AD app is configured as SPA (not Web)
- [ ] Redeploy to Azure Static Web Apps
- [ ] Clear browser cache and test
