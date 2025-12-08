import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  useEffect(() => {
    // Debug: Check if token exists when Home page loads
    const token = localStorage.getItem('authToken');
    console.log('Home page loaded. Token exists:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 50) + '...');
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">Contract Intelligence Agent</h1>
        <p className="text-lg text-gray-600 mb-8">
          Upload, search, chat, and compare contracts effortlessly.
        </p>
        <div className="mb-8">
          <div className="w-full h-48 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
            <span className="text-6xl text-blue-200">📄</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Upload Documents
          </Link>
          <Link
            to="/compare-chat"
            className="bg-gray-100 text-blue-700 px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-200 transition"
          >
            Search / Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
