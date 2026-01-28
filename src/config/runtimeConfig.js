/**
 * Runtime Configuration Loader
 * Fetches configuration from config.json at runtime for Azure Static Web Apps
 */

let configCache = null;

export async function loadRuntimeConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    const response = await fetch('/config.json');
    const config = await response.json();
    
    // Replace placeholders if they weren't substituted
    const clientId = config.azureAd.clientId?.replace(/{{|}}/g, '').trim();
    const tenantId = config.azureAd.tenantId?.replace(/{{|}}/g, '').trim();
    const redirectUri = config.azureAd.redirectUri?.replace(/{{|}}/g, '').trim();
    
    configCache = {
      clientId: clientId || process.env.REACT_APP_AZURE_AD_CLIENT_ID || '',
      tenantId: tenantId || process.env.REACT_APP_AZURE_AD_TENANT_ID || 'common',
      redirectUri: redirectUri || process.env.REACT_APP_AZURE_AD_REDIRECT_URI || window.location.origin,
    };
    
    return configCache;
  } catch (error) {
    console.error('Failed to load runtime config, falling back to environment variables:', error);
    
    // Fallback to environment variables
    configCache = {
      clientId: process.env.REACT_APP_AZURE_AD_CLIENT_ID || '',
      tenantId: process.env.REACT_APP_AZURE_AD_TENANT_ID || 'common',
      redirectUri: process.env.REACT_APP_AZURE_AD_REDIRECT_URI || window.location.origin,
    };
    
    return configCache;
  }
}

export function clearConfigCache() {
  configCache = null;
}
