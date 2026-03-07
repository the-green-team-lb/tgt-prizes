"use client";

import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "2707";
const AUTH_KEY = "tgt_admin_auth";

interface AdminAuthProps {
  children: React.ReactNode;
}

export default function AdminAuth({ children }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_KEY, "true");
      setError("");
    } else {
      setError("Access Denied");
      setPassword("");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-brand-muted">Verifying...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-4">
            <h2 className="text-brand-dark font-bold text-lg">Admin Authentication</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label className="block text-brand-muted text-sm mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-gold transition-colors"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm mb-4 text-center font-medium">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all"
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
