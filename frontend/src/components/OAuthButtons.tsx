import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';
import { useAuth } from '../hooks/useAuth';
import { useAcceptInvitation } from '../hooks/useOrganization';
import { useAuthStore } from '../stores/authStore';

// ============================================================
// OAuthButtons
// Google and Microsoft OAuth login buttons with divider.
// ============================================================

interface OAuthButtonsProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

function OAuthButtons({ onSuccess, onError }: OAuthButtonsProps) {
  const { oauthLogin } = useAuth();
  const { instance } = useMsal();
  const acceptInvitation = useAcceptInvitation();
  const [loading, setLoading] = useState<'google' | 'microsoft' | null>(null);

  const handleInvitation = async () => {
    const pendingToken = sessionStorage.getItem('pendingInvitationToken');
    if (pendingToken) {
      sessionStorage.removeItem('pendingInvitationToken');
      await acceptInvitation.mutateAsync(pendingToken);
      useAuthStore.getState().updateUser({ onboarding_completed: true });
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      onError('Google login failed. No credential received.');
      return;
    }
    setLoading('google');
    try {
      await oauthLogin('google', credentialResponse.credential);
      await handleInvitation();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed.';
      onError(message);
    } finally {
      setLoading(null);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading('microsoft');
    try {
      const result = await instance.loginPopup(loginRequest);
      if (!result.idToken) {
        onError('Microsoft login failed. No token received.');
        setLoading(null);
        return;
      }
      await oauthLogin('microsoft', result.idToken);
      await handleInvitation();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microsoft login failed.';
      onError(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Login */}
      <div className="flex justify-center">
        <div className="w-full [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => onError('Google login failed.')}
            width="360"
            text="continue_with"
            shape="pill"
            size="large"
          />
        </div>
      </div>

      {/* Microsoft Login */}
      <button
        type="button"
        onClick={handleMicrosoftLogin}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                   bg-white border border-separator text-label-primary text-sm font-medium
                   hover:bg-surface-secondary transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Microsoft logo */}
        <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        {loading === 'microsoft' ? 'Signing in...' : 'Continue with Microsoft'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-separator" />
        <span className="text-xs text-label-tertiary">or continue with email</span>
        <div className="flex-1 h-px bg-separator" />
      </div>
    </div>
  );
}

export default OAuthButtons;
