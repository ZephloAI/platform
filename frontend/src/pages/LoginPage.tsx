import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// LoginPage
// Apple-style centered auth form with glass card, gradient
// background accent, and premium typography.
// ============================================================

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 relative overflow-hidden">
      {/* Subtle gradient orbs for depth (Apple-style ambient lighting) */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-3xl" />

      <div className="max-w-sm w-full relative z-10 animate-fade-in">
        {/* Logo and heading */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-semibold text-label-primary tracking-tight mb-1">
            Welcome back
          </h1>
          <p className="text-[15px] text-label-tertiary">
            Sign in to ChatBot Platform
          </p>
        </div>

        {/* Login form in a glass card */}
        <form
          onSubmit={handleSubmit}
          className="glass-card p-8 space-y-5"
        >
          {/* Error message */}
          {error && (
            <div className="bg-red-500/[0.06] text-red-600 text-[13px] rounded-xl p-3.5 border border-red-500/10">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-[13px] text-label-tertiary mt-6">
          New here?{' '}
          <Link to="/register" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
