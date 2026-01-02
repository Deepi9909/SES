import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/authConfig';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { instance } = useMsal();

  const handleAzureLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      console.log('Azure AD login successful:', loginResponse);
      
      // You can store additional user info if needed
      if (loginResponse.account) {
        localStorage.setItem('userRole', 'user'); // Set default role or fetch from your backend
      }
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Azure AD login error:', err);
      setError('Failed to sign in with Microsoft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await loginUser(email, password);
      console.log('Login response:', response);
      
      // Extract data from backend response structure
      const token = response.access_token;
      const user = {
        email: response.username,
        role: response.role
      };
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Use the AuthContext login function to update the state
      login(user, token);
      // Use navigate instead of window.location to prevent page reload
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Overlay and Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/login-bg.jpg')`,
          filter: 'blur(2px)',
          transform: 'scale(1.1)', // Prevents blur edge artifacts
        }}
      />
      {/* Dark Overlay for Better Readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content Container */}
      <div className="max-w-md w-full mx-4 flex flex-col relative z-10">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          {/* Logo/Title Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to access your contracts</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="you@example.com"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider and Social Login Button Centered */}
          <div className="mt-6 flex flex-col items-center w-full">
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-2 bg-white text-gray-500 text-sm">Or continue with</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <button
              type="button"
              onClick={handleAzureLogin}
              disabled={isLoading}
              className="flex items-center justify-center mt-4 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>
                <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>
                <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>
                <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </button>
          </div>
        </div>
        {/* Footer */}
        <p className="mt-8 text-center text-sm text-white drop-shadow-lg">
          © 2025 VMP. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
