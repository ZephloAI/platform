import { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';
import { useAuth } from '../hooks/useAuth';

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
  const [loading, setLoading] = useState<'google' | 'microsoft' | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(320);

  useEffect(() => {
    if (!googleBtnRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.floor(entry.contentRect.width);
      if (width > 0) setGoogleBtnWidth(width);
    });
    observer.observe(googleBtnRef.current);
    return () => observer.disconnect();
  }, []);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      onError('Google login failed. No credential received.');
      return;
    }
    setLoading('google');
    // Pass the pending invitation token so the backend can join the inviting
    // org atomically for new sign-ups.
    const pendingToken = sessionStorage.getItem('pendingInvitationToken') ?? undefined;
    try {
      await oauthLogin('google', credentialResponse.credential, pendingToken);
      if (pendingToken) sessionStorage.removeItem('pendingInvitationToken');
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
      // Use redirect flow — redirects to Microsoft login page and back.
      // The response is handled in main.tsx via handleRedirectPromise().
      await instance.loginRedirect(loginRequest);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microsoft login failed.';
      onError(message);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google Login */}
      <div ref={googleBtnRef} className="w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => onError('Google login failed.')}
          width={googleBtnWidth}
          text="continue_with"
          shape="rectangular"
          size="large"
        />
      </div>

      {/* Microsoft Login */}
      <button
        type="button"
        onClick={handleMicrosoftLogin}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg
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
