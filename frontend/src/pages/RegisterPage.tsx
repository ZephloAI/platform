import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// RegisterPage
// Apple-style registration with glass card and ambient glow.
// Matches the LoginPage visual language for consistency.
// ============================================================

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-3xl" />

      <div className="max-w-sm w-full relative z-10 animate-fade-in">
        {/* Logo and heading */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-semibold text-label-primary tracking-tight mb-1">
            Get started
          </h1>
          <p className="text-[15px] text-label-tertiary">
            Create your ChatBot Platform account
          </p>
        </div>

        {/* Register form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {/* Error */}
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
              placeholder="At least 6 characters"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Re-enter your password"
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-[13px] text-label-tertiary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
