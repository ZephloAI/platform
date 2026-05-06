import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import OAuthButtons from '../components/OAuthButtons';

// ============================================================
// RegisterPage
// Warm Editorial registration with card surface, ambient warm
// gradients, and premium editorial typography.
// ============================================================

// Pulls a user-friendly message out of an axios/HTTP error.
// FastAPI returns either {detail: "..."} or, for usage limits, a structured
// {detail: {code, message, limit}}. We surface `message` when present so the
// user sees "This organization has reached its user limit" instead of a
// generic 402.
function extractErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as any)?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail.message === 'string') return detail.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

    // The invite (if any) is consumed atomically inside /api/auth/register.
    // The backend joins the user to the inviting org and marks onboarding
    // complete in the same transaction, so there's no second call here.
    const pendingToken = sessionStorage.getItem('pendingInvitationToken') ?? undefined;

    try {
      await register(email, password, firstName, lastName, pendingToken);
      if (pendingToken) sessionStorage.removeItem('pendingInvitationToken');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Registration failed. Please try again.'));
      setLoading(false);
      return;
    }

    // Where to land is decided by ProtectedRoute: users without onboarding
    // completed (i.e. no org yet) get redirected to /onboarding; invited
    // users go straight to /dashboard.
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 relative overflow-hidden">
      {/* Grain texture overlay */}
      <div className="grain" />

      {/* Warm ambient gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-accent/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[600px] h-[600px] bg-blue-700/[0.04] rounded-full blur-3xl" />
      <div className="absolute top-[50%] right-[15%] w-[300px] h-[300px] bg-accent/[0.03] rounded-full blur-3xl" />

      <div className="max-w-[400px] w-full relative z-10 animate-fade-in">
        {/* Logo and heading */}
        <div className="text-center mb-12 animate-slide-up">
          <img src="/logo.svg" alt="Zephlo" className="w-16 h-16 mx-auto mb-6" />
          <h1 className="heading-xl font-display text-label-primary mb-2">
            Get started
          </h1>
          <p className="text-base text-label-secondary">
            Create your <span className="font-display font-semibold text-accent">Zephlo</span> account
          </p>
        </div>

        {/* Register form */}
        <form onSubmit={handleSubmit} className="card p-10 space-y-6 shadow-card-lg animate-scale-in">
          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <OAuthButtons
            onSuccess={() => navigate('/dashboard')}
            onError={(msg) => setError(msg)}
          />

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="input-label">First Name</label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="input-label">Last Name</label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                placeholder="Doe"
              />
            </div>
          </div>

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
          <button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-label-tertiary mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
