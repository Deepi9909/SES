import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { getMsalConfig } from './config/authConfig';
import './tailwind.css';
import App from './App';

// Initialize MSAL instance with runtime config
getMsalConfig().then(async (msalConfig) => {
  console.log('========================================');
  console.log('🔧 MSAL Configuration loaded');
  console.log('Client ID:', msalConfig.auth.clientId ? `${msalConfig.auth.clientId.substring(0, 8)}...` : 'MISSING ❌');
  console.log('Authority:', msalConfig.auth.authority);
  console.log('Redirect URI:', msalConfig.auth.redirectUri);
  console.log('========================================');

  if (!msalConfig.auth.clientId) {
    console.error('❌ CRITICAL: Client ID is missing!');
    alert('Azure AD Client ID is not configured. Please check your configuration.');
    return;
  }

  const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL and handle authentication
msalInstance.initialize().then(async () => {
  console.log('========================================');
  console.log('🚀 MSAL INITIALIZED');
  console.log('Current URL:', window.location.href);
  console.log('Has redirect params:', window.location.search.includes('code') || window.location.search.includes('error'));
  console.log('========================================');
  
  let authError = null;
  
  // Set up event callbacks for authentication events
  msalInstance.addEventCallback((event) => {
    console.log('📢 MSAL EVENT:', event.eventType);
    
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
      console.log('✅ Login successful:', account.username);
    }
    
    if (event.eventType === EventType.LOGIN_FAILURE) {
      console.error('❌ Login failed:', event.error);
      console.error('Error details:', event.error?.errorMessage);
      authError = event.error;
    }
  });

  // Handle redirect promise BEFORE rendering app
  try {
    console.log('▶️ Handling redirect promise...');
    const response = await msalInstance.handleRedirectPromise();
    
    if (response) {
      console.log('========================================');
      console.log('✅ Authentication successful!');
      console.log('User:', response.account.username);
      console.log('Access Token:', response.accessToken ? 'Present ✅' : 'Missing ❌');
      console.log('========================================');
    } else {
      console.log('ℹ️ No redirect response (normal page load)');
    }
  } catch (error) {
    console.error('========================================');
    console.error('❌ Authentication error:', error);
    console.error('Error code:', error.errorCode);
    console.error('Error message:', error.errorMessage);
    console.error('Error description:', error.errorMessage);
    console.error('========================================');
    authError = error;
    
    // Show error to user
    alert(`Authentication failed:\n\n${error.errorCode}\n\n${error.errorMessage}\n\nPlease contact your administrator.`);
  }

  // Set active account if available
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Render app AFTER authentication is handled
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
});
}).catch(error => {
  console.error('Failed to initialize MSAL:', error);
  alert('Failed to load authentication configuration. Please refresh the page.');
});
