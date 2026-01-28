/**
 * Azure AD B2C Configuration
 * 
 * This file contains the MSAL (Microsoft Authentication Library) configuration
 * for Azure AD authentication.
 */

export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: process.env.REACT_APP_AZURE_AD_REDIRECT_URI_DEV || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_AZURE_AD_REDIRECT_URI_DEV|| window.location.origin,
    navigateToLoginRequestUrl: false, // Prevent double navigation
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error('[MSAL]', message);
            return;
          case 1: // LogLevel.Warning
            console.warn('[MSAL]', message);
            return;
          default:
            return;
        }
      },
      logLevel: 1,
    },
  },
};

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
