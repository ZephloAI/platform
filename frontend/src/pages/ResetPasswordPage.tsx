import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';

// ============================================================
// ResetPasswordPage
// Reads the one-time reset token from ?token=... and lets the
// user set a new password. On success, we send them to the
// login page — any previous sessions are already invalidated
// on the server.
// ============================================================

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const tokenMissing = !token;

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
      await apiClient.post('/api/auth/reset-password', {
        token,
        new_password: password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      // Surface the backend message if available (e.g. "Invalid or expired reset token")
      type AxiosLike = { response?: { data?: { detail?: string } } };
      const maybe = err as AxiosLike;
      const message =
        maybe?.response?.data?.detail ??
        (err instanceof Error ? err.message : 'Could not reset password.');
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
            Choose a new password
          </h1>
          <p className="text-base text-label-secondary">
            Pick something you haven't used before.
          </p>
        </div>

        <div className="card p-10 space-y-6 shadow-card-lg animate-scale-in">
          {tokenMissing ? (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">
              This reset link is missing its token. Please request a new one.
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-700 text-sm rounded-xl p-4 border border-green-100">
                Password updated. Taking you to sign in...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="input-label">New password</label>
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

              <div>
                <label htmlFor="confirm" className="input-label">Confirm new password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Re-enter your password"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-accent w-full">
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-label-tertiary mt-8">
          <Link to="/login" className="text-accent font-semibold hover:text-accent-hover transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
