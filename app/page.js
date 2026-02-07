'use client';

import { useState, useEffect } from 'react';
import LoginPage from '../components/LoginPage';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('ps_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.authenticated && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        setAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (password) => {
    const validHash = 'ps2024secure';
    if (password === validHash) {
      localStorage.setItem('ps_session', JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
      }));
      setAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('ps_session');
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
