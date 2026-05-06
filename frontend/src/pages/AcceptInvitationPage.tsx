import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useAcceptInvitation,
  useInvitationPreview,
} from '../hooks/useOrganization';
import { useOrgStore } from '../stores/orgStore';

// ============================================================
// Accept Invitation Page
// Shows a preview of the invite (org + inviter) and either an
// Accept button (if signed in) or a Sign-in prompt (if not).
// ============================================================

type Status =
  | 'loading'
  | 'preview'
  | 'login-required'
  | 'accepting'
  | 'success'
  | 'error';

function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const acceptInvitation = useAcceptInvitation();
  const fetchOrganizations = useOrgStore((state) => state.fetchOrganizations);

  const { data: preview, isLoading, error: previewError } = useInvitationPreview(token);

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Stash token so the login/register flow can auto-redirect back here.
  useEffect(() => {
    if (token) sessionStorage.setItem('pendingInvitationToken', token);
  }, [token]);

  // Drive status off preview load + auth state.
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link.');
      return;
    }
    if (isLoading) {
      setStatus('loading');
      return;
    }
    if (previewError) {
      setStatus('error');
      const err = previewError as any;
      const detail = err?.response?.data?.detail;
      const httpStatus = err?.response?.status;
      if (httpStatus === 404) {
        setErrorMessage('This invitation could not be found. It may have been cancelled.');
      } else if (detail) {
        setErrorMessage(detail);
      } else {
        setErrorMessage(
          httpStatus
            ? `Could not load invitation (HTTP ${httpStatus}).`
            : 'Could not reach the server. Check your connection and try again.',
        );
      }
      return;
    }
    if (preview?.is_expired || preview?.status === 'expired') {
      setStatus('error');
      setErrorMessage('This invitation has expired. Ask for a new one.');
      return;
    }
    if (preview?.status === 'accepted') {
      setStatus('error');
      setErrorMessage('This invitation has already been accepted.');
      return;
    }
    setStatus(isAuthenticated ? 'preview' : 'login-required');
  }, [token, isAuthenticated, isLoading, previewError, preview]);

  const handleAccept = () => {
    if (!token) return;
    setStatus('accepting');
    acceptInvitation.mutate(token, {
      onSuccess: () => {
        setStatus('success');
        fetchOrganizations();
        sessionStorage.removeItem('pendingInvitationToken');
        setTimeout(() => navigate('/dashboard'), 1500);
      },
      onError: (err: any) => {
        setStatus('error');
        const detail = err?.response?.data?.detail;
        // Usage-limit errors return a structured {code, message, limit};
        // everything else is a string.
        const message =
          typeof detail === 'string'
            ? detail
            : detail?.message || 'Failed to accept invitation.';
        setErrorMessage(message);
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center">
      <div className="max-w-sm w-full mx-4 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-[14px] text-label-secondary">Loading invitation...</p>
          </div>
        )}

        {(status === 'preview' || status === 'login-required') && preview && (
          <div className="space-y-5">
            <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-[20px] font-semibold text-label-primary">
                You're invited to {preview.organization_name ?? 'an organization'}
              </h1>
              {preview.inviter_email && (
                <p className="text-[13px] text-label-tertiary">
                  {preview.inviter_email} invited you as a {preview.role}.
                </p>
              )}
            </div>

            {status === 'preview' ? (
              <button
                onClick={handleAccept}
                className="btn-primary mt-2"
                disabled={acceptInvitation.isPending}
              >
                {acceptInvitation.isPending ? 'Accepting...' : 'Accept invitation'}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[13px] text-label-tertiary">
                  Sign in to accept this invitation.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-secondary"
                  >
                    Create account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'accepting' && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-[14px] text-label-secondary">Accepting invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-[20px] font-semibold text-label-primary">
              You're in
            </h1>
            <p className="text-[14px] text-label-tertiary">Redirecting to dashboard...</p>
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
              Could not accept invitation
            </h1>
            <p className="text-[14px] text-label-tertiary">{errorMessage}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary mt-4"
            >
              Go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
