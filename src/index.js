import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import './tailwind.css';
import App from './App';
import { setupNetworkLogging } from './utils/networkLogger';

// Enable network request logging
setupNetworkLogging();

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect promise
msalInstance.initialize().then(() => {
  console.log('========================================');
  console.log('🚀 MSAL INITIALIZED');
  console.log('========================================');
  
  // Account selection logic is app dependent. Adjust as needed for different use cases.
  const accounts = msalInstance.getAllAccounts();
  console.log('Existing accounts found:', accounts.length);
  
  if (accounts.length > 0) {
    console.log('Setting active account:', accounts[0]);
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    console.log('========================================');
    console.log('📢 MSAL EVENT:', event.eventType);
    console.log('========================================');
    console.log('Event payload:', event.payload);
    console.log('Event error:', event.error);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================');
    
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
      console.log('✅ Login successful! Account:', account);
    }
    
    if (event.eventType === EventType.LOGIN_FAILURE) {
      console.error('❌ Login failed! Error:', event.error);
    }
    
    if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
      console.log('✅ Token acquired successfully!');
    }
    
    if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
      console.error('❌ Token acquisition failed!');
    }
  });

  // Handle redirect responses
  console.log('▶️ Handling redirect promise...');
  msalInstance.handleRedirectPromise().then((response) => {
    console.log('========================================');
    console.log('🔄 REDIRECT PROMISE RESOLVED');
    console.log('========================================');
    
    if (response) {
      console.log('✅ Response received from redirect!');
      console.log('Access Token:', response.accessToken ? '✅ Present' : '❌ Missing');
      console.log('ID Token:', response.idToken ? '✅ Present' : '❌ Missing');
      console.log('Account:', response.account);
      console.log('Scopes:', response.scopes);
      console.log('Token Type:', response.tokenType);
      console.log('Expires On:', response.expiresOn);
      console.log('Full Response:', response);
      console.log('========================================');
    } else {
      console.log('ℹ️ No redirect response (normal page load)');
      console.log('========================================');
    }
  }).catch((error) => {
    console.error('========================================');
    console.error('❌ REDIRECT PROMISE ERROR');
    console.error('========================================');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.errorCode);
    console.error('Error Stack:', error.stack);
    console.error('Full Error:', error);
    console.error('========================================');
  });

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
});
