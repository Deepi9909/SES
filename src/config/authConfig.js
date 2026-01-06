/**
 * Azure AD B2C Configuration
 * 
 * This file contains the MSAL (Microsoft Authentication Library) configuration
 * for Azure AD authentication.
 */

// Debug: Log environment variables
console.log('=== MSAL Configuration Debug ===');
console.log('REACT_APP_AZURE_AD_CLIENT_ID:', process.env.REACT_APP_AZURE_AD_CLIENT_ID);
console.log('REACT_APP_AZURE_AD_TENANT_ID:', process.env.REACT_APP_AZURE_AD_TENANT_ID);
console.log('REACT_APP_AZURE_AD_REDIRECT_URI:', process.env.REACT_APP_AZURE_AD_REDIRECT_URI);
console.log('window.location.origin:', window.location.origin);

export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: process.env.REACT_APP_AZURE_AD_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_AZURE_AD_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error('[MSAL Error]', message);
            return;
          case 1: // LogLevel.Warning
            console.warn('[MSAL Warning]', message);
            return;
          case 2: // LogLevel.Info
            console.info('[MSAL Info]', message);
            return;
          case 3: // LogLevel.Verbose
            console.debug('[MSAL Verbose]', message);
            return;
          default:
            return;
        }
      },
      logLevel: 3, // Set to Verbose for detailed logging
    },
  },
};

// Debug: Log the final configuration
console.log('=== Final MSAL Config ===');
console.log('clientId:', msalConfig.auth.clientId);
console.log('authority:', msalConfig.auth.authority);
console.log('redirectUri:', msalConfig.auth.redirectUri);

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 */
export const loginRequest = {
  scopes: ['User.Read'],
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API.
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
