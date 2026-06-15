import { useEffect } from 'react';
import type { ZephloInstance } from 'zephlo';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useOrgStore } from '../../stores/orgStore';
import { describeError, err, ok } from '../util';
import type { Organization } from '../../types';

// Read-only identity / workspace context tools, plus org switching.
// These mostly help the assistant answer "who am I and where am I working?"

interface Props {
  instance: ZephloInstance;
}

function AccountToolsRegistrar({ instance }: Props) {
  const { user } = useAuth();
  const activeOrg = useOrgStore((s) => s.activeOrganization);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  useEffect(() => {
    instance.registerTool({
      name: 'get_current_user',
      description: 'Return the currently signed-in user (id, email, name, admin flag).',
      inputSchema: { type: 'object', properties: {} },
      execute: () => {
        if (!user) return err('No user is signed in.');
        return ok({
          id: user.id,
          email: user.email,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
          is_platform_admin: !!user.is_platform_admin,
          onboarding_completed: !!user.onboarding_completed,
        });
      },
    });

    instance.registerTool({
      name: 'get_current_org',
      description: 'Return the user\'s active organization (id, name, role).',
      inputSchema: { type: 'object', properties: {} },
      execute: () => {
        if (!activeOrg) return err('No active organization.');
        return ok({ id: activeOrg.id, name: activeOrg.name, role: activeOrg.role });
      },
    });

    instance.registerTool({
      name: 'list_organizations',
      description: 'List every organization the user belongs to.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        try {
          const response = await apiClient.get<Organization[]>('/api/organizations');
          return ok(
            response.data.map((o) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
              role: o.role,
            })),
          );
        } catch (e) {
          return err('Failed to list organizations', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'switch_org',
      description: 'Switch the active organization. All subsequent API calls (and the dashboard view) use this org.',
      inputSchema: {
        type: 'object',
        properties: { org_id: { type: 'number', description: 'Target organization id' } },
        required: ['org_id'],
      },
      execute: async (params) => {
        try {
          const targetId = params.org_id as number;
          const response = await apiClient.get<Organization[]>('/api/organizations');
          const target = response.data.find((o) => o.id === targetId);
          if (!target) return err(`Organization ${targetId} not found in your memberships.`);
          setActiveOrg(target);
          return ok({ active_org: { id: target.id, name: target.name, role: target.role } });
        } catch (e) {
          return err('Failed to switch organization', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, user, activeOrg]);

  return null;
}

export default AccountToolsRegistrar;
