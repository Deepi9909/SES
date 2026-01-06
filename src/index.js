import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import './tailwind.css';
import App from './App';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL and handle authentication
msalInstance.initialize().then(async () => {
  console.log('🚀 MSAL INITIALIZED');
  
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
    }
  });

  // Handle redirect promise BEFORE rendering app
  try {
    const response = await msalInstance.handleRedirectPromise();
    
    if (response) {
      console.log('✅ Authentication successful!');
      console.log('User:', response.account.username);
      // Account is automatically set by event callback
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
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
