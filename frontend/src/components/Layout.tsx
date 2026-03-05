import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Simple top nav for Home / Dashboard pages */}
      <nav className="h-14 border-b border-black/[0.06] flex items-center justify-between px-8 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-label-primary tracking-tight">
            ChatBot
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[13px] text-label-tertiary">{user?.email}</span>
          <button
            onClick={logout}
            className="text-[13px] text-label-secondary hover:text-label-primary font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
