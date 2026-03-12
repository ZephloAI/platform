import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAcceptInvitation } from '../hooks/useOrganization';
import { useOrgStore } from '../stores/orgStore';

// ============================================================
// Accept Invitation Page
// Handles invitation token from URL, accepts it if authenticated
// ============================================================

function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const acceptInvitation = useAcceptInvitation();
  const fetchOrganizations = useOrgStore((state) => state.fetchOrganizations);

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login-required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link.');
      return;
    }

    if (!isAuthenticated) {
      // Store token so we can accept after login
      sessionStorage.setItem('pendingInvitationToken', token);
      setStatus('login-required');
      return;
    }

    // Accept the invitation
    acceptInvitation.mutate(token, {
      onSuccess: () => {
        setStatus('success');
        fetchOrganizations();
        setTimeout(() => navigate('/dashboard'), 2000);
      },
      onError: (err: any) => {
        setStatus('error');
        setErrorMessage(
          err?.response?.data?.detail || 'Failed to accept invitation. It may have expired.'
        );
      },
    });
  }, [token, isAuthenticated]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-sm w-full mx-4 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-[14px] text-label-secondary">Accepting invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-[20px] font-semibold text-label-primary">
              Invitation Accepted
            </h1>
            <p className="text-[14px] text-label-tertiary">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-[20px] font-semibold text-label-primary">
              Could Not Accept Invitation
            </h1>
            <p className="text-[14px] text-label-tertiary">{errorMessage}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary mt-4"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'login-required' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-[20px] font-semibold text-label-primary">
              Sign In Required
            </h1>
            <p className="text-[14px] text-label-tertiary">
              Please sign in to accept this invitation. Your invitation will be applied automatically.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary mt-4"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
