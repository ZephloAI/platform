import { useState, useRef, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOrgStore } from '../stores/orgStore';

function titleCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  const initial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-surface-primary grain">
      {/* Top nav */}
      <header className="h-16 border-b border-black/[0.06] flex items-center justify-between gap-4 px-4 md:px-8 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        {/* Left: logo */}
        <div className="flex items-center min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="Zephlo" className="w-7 h-7" />
            <span className="text-[18px] font-display font-bold text-label-primary tracking-tight">
              Zephlo
            </span>
          </Link>
        </div>

        {/* Right: workspace + avatar */}
        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-semibold text-label-primary leading-tight truncate max-w-[160px]">
                {activeOrganization?.name || 'Workspace'}
              </p>
              {activeOrganization?.role && (
                <p className="text-[11px] text-label-tertiary leading-tight">
                  {titleCase(activeOrganization.role)} Workspace
                </p>
              )}
            </div>

            {/* Account avatar dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                {initial}
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
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>groups</span>
                        Organization
                      </Link>
                    )}
                    {user?.is_platform_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-label-secondary hover:bg-black/[0.03] hover:text-label-primary transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shield_person</span>
                        <span className="flex-1">Platform Admin</span>
                        <span className="text-[10px] uppercase tracking-wide bg-accent-light text-accent px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-black/[0.06] py-1">
                    <button
                      onClick={() => { setAccountOpen(false); logout(); }}
                      className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
