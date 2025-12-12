import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 shadow-sm z-50 flex items-center h-20 px-6" style={{ backgroundColor: '#1a0b3d' }}>
      <div className="flex items-center w-72">
        <img 
          src="/images/SES_LOGO.png" 
          alt="SES Logo" 
          className="h-10 w-auto object-contain"
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
        {/* User info */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition cursor-pointer"
            >
              <span className="text-white font-medium text-sm">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100]">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Logged in</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
