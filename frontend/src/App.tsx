import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import SymptomModal from './components/SymptomModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import Timeline from './pages/Timeline';
import SettingsPage from './pages/Settings';
import About from './pages/About';
import api from './services/api';
import { DashboardStats } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [userName, setUserName] = useState<string>(localStorage.getItem('userName') || 'User');
  const [userRole, setUserRole] = useState<string>(localStorage.getItem('userRole') || 'patient');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [activeTitle, setActiveTitle] = useState('Dashboard');

  const fetchDashboardStats = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/api/patient/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (token: string, name: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', name || 'User');
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserName(name || 'User');
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setStats(null);
  };

  const handleSymptomLogSaved = () => {
    fetchDashboardStats();
  };

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <div className="min-h-screen bg-slate-50/50 flex flex-col">
          {/* Side navigation bar */}
          <Sidebar userName={userName} onLogout={handleLogout} />
          
          {/* Top navigation bar */}
          <Navbar 
            title={activeTitle} 
            stats={stats} 
            onOpenSymptomModal={() => setIsSymptomModalOpen(true)} 
          />

          {/* Page Routing */}
          <main className="flex-1">
            <Routes>
              <Route 
                path="/" 
                element={
                  <PageWrapper title="Dashboard" onActive={setActiveTitle}>
                    <Dashboard stats={stats} onRefreshStats={fetchDashboardStats} />
                  </PageWrapper>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <PageWrapper title="Analytics Cockpit" onActive={setActiveTitle}>
                    <Analytics />
                  </PageWrapper>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <PageWrapper title="AI Health Chat" onActive={setActiveTitle}>
                    <Chat />
                  </PageWrapper>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <PageWrapper title="Medical Reports" onActive={setActiveTitle}>
                    <Reports />
                  </PageWrapper>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <PageWrapper title="History & Clinical Logs" onActive={setActiveTitle}>
                    <Timeline />
                  </PageWrapper>
                } 
              />
              <Route path="/timeline" element={<Navigate to="/history" />} />
              <Route 
                path="/settings" 
                element={
                  <PageWrapper title="Settings & Profile" onActive={setActiveTitle}>
                    <SettingsPage />
                  </PageWrapper>
                } 
              />
              <Route 
                path="/about" 
                element={
                  <PageWrapper title="About & Architecture" onActive={setActiveTitle}>
                    <About />
                  </PageWrapper>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Make Report Modal */}
          {isSymptomModalOpen && (
            <SymptomModal 
              onClose={() => setIsSymptomModalOpen(false)} 
              onLogSaved={handleSymptomLogSaved} 
            />
          )}
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

interface PageWrapperProps {
  title: string;
  onActive: (title: string) => void;
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ title, onActive, children }) => {
  useEffect(() => {
    onActive(title);
  }, [title, onActive]);
  return <>{children}</>;
};

export default App;
