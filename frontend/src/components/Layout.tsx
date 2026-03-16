import { useState, useRef, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOrgStore } from '../stores/orgStore';

function Layout() {
  const { user, logout } = useAuth();
  const { activeOrganization, fetchOrganizations } = useOrgStore();

  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Fetch orgs on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-surface-primary grain">
      {/* Top nav */}
      <nav className="h-14 border-b border-black/[0.06] flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-[15px] font-display font-bold text-label-primary tracking-tight">
            Flunkie
          </span>
        </div>

        {/* Account avatar dropdown */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 dropdown-glass rounded-xl overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-black/[0.06]">
                <p className="text-[13px] font-semibold text-label-primary truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email?.split('@')[0]}
                </p>
                <p className="text-[12px] text-label-tertiary truncate mt-0.5">{user?.email}</p>
                {activeOrganization && (
                  <p className="text-[11px] text-label-quaternary truncate mt-1">{activeOrganization.name}</p>
                )}
              </div>
              <div className="py-1">
                {activeOrganization && (
                  <Link
                    to={`/organizations/${activeOrganization.id}/settings`}
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-label-secondary hover:bg-black/[0.03] hover:text-label-primary transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Organization
                  </Link>
                )}
              </div>
              <div className="border-t border-black/[0.06] py-1">
                <button
                  onClick={() => { setAccountOpen(false); logout(); }}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
