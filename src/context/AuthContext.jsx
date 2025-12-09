import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    console.log('AuthContext: Checking auth on mount');
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('Token on mount:', token ? 'EXISTS' : 'MISSING');
    
    if (token && userEmail) {
      setIsAuthenticated(true);
      setUser({ email: userEmail });
    }
    
    setIsLoading(false);
    
    // Monitor localStorage changes
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      if (!currentToken && isAuthenticated) {
        console.error('⚠️ TOKEN WAS CLEARED! User was authenticated but token is now missing');
        console.trace('Token disappeared');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = (userData, token) => {
    console.log('AuthContext.login called with:', { userData, token });
    console.log('Token type:', typeof token);
    console.log('Token value:', token);
    
    if (!token) {
      console.error('No token provided to login function!');
      return;
    }
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', userData.email);
    setIsAuthenticated(true);
    setUser(userData);
    
    console.log('Token saved to localStorage:', localStorage.getItem('authToken'));
  };

  const logout = () => {
    console.log('LOGOUT CALLED - Stack trace:', new Error().stack);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
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
