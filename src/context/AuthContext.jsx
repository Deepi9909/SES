import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { instance, accounts } = useMsal();

  // Check authentication status on mount
  useEffect(() => {
    console.log('AuthContext: Checking auth on mount');
    
    // Check for Azure AD authentication first
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      console.log('Azure AD user found:', account);
      setIsAuthenticated(true);
      setUser({ 
        email: account.username, 
        name: account.name,
        role: localStorage.getItem('userRole'),
        authType: 'azure-ad'
      });
      setIsLoading(false);
      return;
    }
    
    // Fallback to traditional token-based auth
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Token on mount:', token ? 'EXISTS' : 'MISSING');
    
    if (token && userEmail) {
      setIsAuthenticated(true);
      setUser({ email: userEmail, role: userRole, authType: 'traditional' });
    }
    
    setIsLoading(false);
    
    // Monitor localStorage changes
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      if (!currentToken && isAuthenticated && user?.authType === 'traditional') {
        console.error('⚠️ TOKEN WAS CLEARED! User was authenticated but token is now missing');
        console.trace('Token disappeared');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [accounts, isAuthenticated, user?.authType]);

  const login = (userData, token) => {
    console.log('AuthContext.login called with:', { userData, token });
    
    if (!token) {
      console.error('No token provided to login function!');
      return;
    }
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', userData.email);
    if (userData.role) {
      localStorage.setItem('userRole', userData.role);
    }
    setIsAuthenticated(true);
    setUser({ ...userData, authType: 'traditional' });
    
    console.log('Login successful - User authenticated');
  };

  const logout = async () => {
    console.log('Logging out user');
    
    // Clear traditional auth
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // If Azure AD user, logout from Azure AD
    if (user?.authType === 'azure-ad' && accounts.length > 0) {
      try {
        await instance.logoutPopup({
          account: accounts[0],
        });
      } catch (error) {
        console.error('Azure AD logout error:', error);
      }
    }
    
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
