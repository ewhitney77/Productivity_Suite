'use client';

import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Access denied');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl" />

      <div className={`relative z-10 w-full max-w-sm px-6 ${shaking ? 'animate-shake' : ''}`}>
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 glow-green">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-green to-accent-mint rounded-2xl flex items-center justify-center mb-4">
              <span className="text-dark-bg font-bold text-xl tracking-tight">EW</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{"Ethan's Notes"}</h1>
            <p className="text-text-secondary text-sm mt-1">Secure access required</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter access key"
                className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-primary
                         focus:border-accent-green focus:ring-1 focus:ring-accent-green/30 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-accent-green to-accent-mint text-dark-bg font-semibold
                       rounded-lg hover:opacity-90 transition-all
                       focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            >
              Authenticate
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-text-muted text-xs">
            <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse-dot" />
            <span>Encrypted connection</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
