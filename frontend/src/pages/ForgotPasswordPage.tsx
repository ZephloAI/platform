import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

// ============================================================
// ForgotPasswordPage
// Collects an email address and asks the backend to send a
// password-reset link. We always show the same confirmation so
// we never leak which emails exist.
// ============================================================

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 relative overflow-hidden">
      <div className="grain" />
      <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-accent/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-[-25%] left-[-10%] w-[600px] h-[600px] bg-blue-700/[0.04] rounded-full blur-3xl" />

      <div className="max-w-[400px] w-full relative z-10 animate-fade-in">
        <div className="text-center mb-12 animate-slide-up">
          <img src="/logo.svg" alt="Zephlo" className="w-16 h-16 mx-auto mb-6" />
          <h1 className="heading-xl font-display text-label-primary mb-2">
            Reset your password
          </h1>
          <p className="text-base text-label-secondary">
            Enter your email and we'll send you a link to get back in.
          </p>
        </div>

        <div className="card p-10 space-y-6 shadow-card-lg animate-scale-in">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-700 text-sm rounded-xl p-4 border border-green-100">
                If an account exists for <span className="font-semibold">{email}</span>,
                a reset link is on its way. The link expires in 15 minutes.
              </div>
              <Link
                to="/login"
                className="inline-block text-accent font-semibold hover:text-accent-hover transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">
                  {error}
                </div>
              )}

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

              <button type="submit" disabled={loading} className="btn-accent w-full">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-label-tertiary mt-8">
          Remembered it?{' '}
          <Link to="/login" className="text-accent font-semibold hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
