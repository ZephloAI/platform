import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// Layout Component
// Premium navigation with frosted glass effect.
// Apple-style sticky nav that blurs content beneath it.
// ============================================================

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Frosted glass navigation bar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-glass-lg border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-label-primary tracking-tight">
                ChatBot
              </span>
            </Link>

            {/* Right side: user info and logout */}
            <div className="flex items-center gap-5">
              <span className="text-[13px] text-label-tertiary">{user?.email}</span>
              <button
                onClick={logout}
                className="text-[13px] text-label-secondary hover:text-label-primary font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content with generous padding */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
