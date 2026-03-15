import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAcceptInvitation } from '../hooks/useOrganization';

// ============================================================
// LoginPage
// Warm Editorial auth form with card surface, ambient warm
// gradients, and premium editorial typography.
// ============================================================

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const acceptInvitation = useAcceptInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      // Check for a pending invitation token stored before login
      const pendingToken = sessionStorage.getItem('pendingInvitationToken');
      if (pendingToken) {
        sessionStorage.removeItem('pendingInvitationToken');
        acceptInvitation.mutate(pendingToken);
      }

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
      {/* Grain texture overlay */}
      <div className="grain" />

      {/* Warm ambient gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-accent/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-[-25%] left-[-10%] w-[600px] h-[600px] bg-amber-700/[0.04] rounded-full blur-3xl" />
      <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-accent/[0.03] rounded-full blur-3xl" />

      <div className="max-w-[400px] w-full relative z-10 animate-fade-in">
        {/* Logo and heading */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="heading-xl font-display text-label-primary mb-2">
            Welcome back
          </h1>
          <p className="text-base text-label-secondary">
            Sign in to <span className="font-display font-semibold text-accent">Flunkie</span>
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="card p-10 space-y-6 shadow-card-lg animate-scale-in"
        >
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">
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
          <button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-label-tertiary mt-8">
          New here?{' '}
          <Link to="/register" className="text-accent font-semibold hover:text-accent-hover transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
