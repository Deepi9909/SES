import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import Home from './pages/Home/Home';
import DocumentUpload from './pages/DocumentUpload/DocumentUpload';
import ContractCompareChat from './pages/ContractCompareChat/ContractCompareChat';
import Login from './pages/Login/Login';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route - Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative" style={{ backgroundImage: "url('/images/login-bg.jpg')" }}>
              {/* Subtle overlay for readability */}
              <div className="absolute inset-0 bg-white/40 z-0"></div>
              
              {/* Content layer */}
              <div className="relative z-10 flex flex-col min-h-screen">
                <Topbar />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/upload" element={<DocumentUpload />} />
                      <Route path="/compare-chat" element={<ContractCompareChat />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
