# Quick Configuration Reference

## Your Azure AD Credentials
Update the `.env` file with these values:

```env
REACT_APP_AZURE_AD_CLIENT_ID=<paste-your-client-id>
REACT_APP_AZURE_AD_TENANT_ID=<paste-your-tenant-id>
REACT_APP_AZURE_AD_REDIRECT_URI=http://localhost:3000
```

## Azure Portal Configuration Checklist

### App Registration → Authentication
- [ ] Platform: Single-page application (SPA)
- [ ] Redirect URI: `http://localhost:3000`
- [ ] Redirect URI: `<your-production-url>` (when deploying)
- [ ] Implicit grant: ✅ Access tokens
- [ ] Implicit grant: ✅ ID tokens

### App Registration → API Permissions
- [ ] Microsoft Graph → User.Read (Delegated)
- [ ] Grant admin consent (if required by your organization)

### App Registration → Overview
- Application (client) ID: `<copy this to .env as REACT_APP_AZURE_AD_CLIENT_ID>`
- Directory (tenant) ID: `<copy this to .env as REACT_APP_AZURE_AD_TENANT_ID>`

## Test Your Setup
1. Update `.env` with your credentials
2. Run: `npm start`
3. Navigate to: `http://localhost:3000/login`
4. Click: "Sign in with Microsoft"
5. Authenticate with your Microsoft account
6. You should be redirected to the home page

## Production Deployment
When deploying to Azure Static Web Apps or other hosting:
1. Set environment variable: `REACT_APP_AZURE_AD_CLIENT_ID`
2. Set environment variable: `REACT_APP_AZURE_AD_TENANT_ID`
3. Set environment variable: `REACT_APP_AZURE_AD_REDIRECT_URI` (production URL)
4. Add production URL to Azure AD redirect URIs
