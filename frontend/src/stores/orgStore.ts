import { create } from 'zustand';
import apiClient from '../api/client';
import type { Organization } from '../types';

// ============================================================
// Organization Store (Zustand)
// Manages active organization state with localStorage persistence
// ============================================================

interface OrgState {
  activeOrganization: Organization | null;
  organizations: Organization[];
  setActiveOrg: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  fetchOrganizations: () => Promise<void>;
  clearOrganizations: () => void;
}

function getStoredOrg(): Organization | null {
  try {
    const raw = localStorage.getItem('activeOrganization');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useOrgStore = create<OrgState>((set, get) => ({
  activeOrganization: getStoredOrg(),
  organizations: [],

  setActiveOrg: (org: Organization) => {
    localStorage.setItem('activeOrganization', JSON.stringify(org));
    set({ activeOrganization: org });
  },

  setOrganizations: (orgs: Organization[]) => {
    set({ organizations: orgs });
  },

  fetchOrganizations: async () => {
    try {
      const response = await apiClient.get('/api/organizations');
      const orgs: Organization[] = response.data;
      set({ organizations: orgs });

      // Update active org with fresh data, or default to the first one
      const current = get().activeOrganization;
      if (orgs.length > 0) {
        const updated = current
          ? orgs.find((o) => o.id === current.id) || orgs[0]
          : orgs[0];
        localStorage.setItem('activeOrganization', JSON.stringify(updated));
        set({ activeOrganization: updated });
      }
    } catch {
      // Silently ignore - org endpoint may not exist yet
    }
  },

  clearOrganizations: () => {
    localStorage.removeItem('activeOrganization');
    set({ activeOrganization: null, organizations: [] });
  },
}));
