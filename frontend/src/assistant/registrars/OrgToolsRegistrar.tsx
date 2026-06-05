import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import apiClient from '../../api/client';
import { useOrgStore } from '../../stores/orgStore';
import { useCreateOrgApiKey } from '../../hooks/useOrganization';
import { describeError, err, ok } from '../util';
import type {
  ApiKey,
  Invitation,
  OrganizationMember,
  UsageSnapshot,
} from '../../types';

// Organization-level tools — read members / invites / API keys / usage,
// plus safe mutations (invite a user, create an API key).
// Destructive operations (remove member, revoke key, cancel invite) are
// intentionally not exposed — the assistant uses `open_org_settings`
// to send the user to the page where they perform those themselves.

interface Props {
  instance: ZephloInstance;
}

function OrgToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  // useCreateOrgApiKey bakes the org id into both its mutationFn URL and its
  // invalidation key. Bind it to the active org so the same cache the org
  // settings page reads gets refreshed after creation.
  const activeOrgId = useOrgStore((s) => s.activeOrganization?.id);
  const createKey = useCreateOrgApiKey(activeOrgId ?? 0);

  useEffect(() => {
    const resolveOrgId = (override?: number) =>
      override ?? useOrgStore.getState().activeOrganization?.id;

    instance.registerTool({
      name: 'list_members',
      description: 'List members of the active organization.',
      inputSchema: { type: 'object', properties: { org_id: { type: 'number' } } },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const response = await apiClient.get<OrganizationMember[]>(
            `/api/organizations/${orgId}/members`,
          );
          return ok({ count: response.data.length, members: response.data });
        } catch (e) {
          return err('Failed to list members', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'list_invitations',
      description: 'List pending invitations for the active organization.',
      inputSchema: { type: 'object', properties: { org_id: { type: 'number' } } },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const response = await apiClient.get<Invitation[]>(
            `/api/organizations/${orgId}/invitations`,
          );
          return ok({ count: response.data.length, invitations: response.data });
        } catch (e) {
          return err('Failed to list invitations', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'invite_user',
      description: 'Invite a user to the active organization. Role must be one of "creator", "admin", "member".',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          role: { type: 'string', enum: ['creator', 'admin', 'member'] },
          org_id: { type: 'number' },
          ...navigateProp,
        },
        required: ['email', 'role'],
      },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const response = await apiClient.post<Invitation>(
            `/api/organizations/${orgId}/invitations`,
            { email: params.email, role: params.role },
          );
          if (params.navigate) navigate(`/organizations/${orgId}/settings`);
          return ok({ id: response.data.id, email: response.data.email, role: response.data.role });
        } catch (e) {
          return err('Failed to invite user', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'list_org_api_keys',
      description: 'List organization-level API keys (prefixes only — full keys are never returned by the server after creation).',
      inputSchema: { type: 'object', properties: { org_id: { type: 'number' } } },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const response = await apiClient.get<ApiKey[]>(
            `/api/organizations/${orgId}/api-keys`,
          );
          return ok({
            count: response.data.length,
            keys: response.data.map((k) => ({
              id: k.id,
              name: k.name,
              prefix: `${k.key_prefix}••••`,
              created_at: k.created_at,
            })),
          });
        } catch (e) {
          return err('Failed to list API keys', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'create_org_api_key',
      description: 'Create an organization-level API key for the active organization and copy the plaintext key to the user\'s clipboard. The plaintext key is never returned to the assistant — only a confirmation that it was created and copied.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Display name for the key (e.g. "Production")' },
          org_id: { type: 'number', description: 'Optional — must match the active organization. If different, call switch_org first.' },
        },
        required: ['name'],
      },
      execute: async (params) => {
        try {
          if (!activeOrgId) return err('No active organization.');
          if (params.org_id !== undefined && (params.org_id as number) !== activeOrgId) {
            return err('That org is not the active one. Call switch_org first, then retry.');
          }
          const created = await createKey.mutateAsync({ name: params.name as string });

          try {
            await navigator.clipboard.writeText(created.key);
          } catch {
            // Clipboard write blocked (insecure context, lost focus, etc.).
            // The key cannot be retrieved again, so the safest move is to tell
            // the user to revoke this one from the UI and create another. We
            // never leak the plaintext into the chat transcript.
            return err(
              'API key created, but copying to the clipboard failed. Open the API Keys page, revoke the key just created, and try again.',
              { id: created.id, name: created.name, prefix: `${created.key_prefix}••••` },
            );
          }
          return ok({
            id: created.id,
            name: created.name,
            prefix: `${created.key_prefix}••••`,
            status: 'Created and copied to clipboard.',
            tell_user: `Created the API key "${created.name}" and copied it to your clipboard. Paste it somewhere safe — it can\'t be shown again.`,
          });
        } catch (e) {
          return err('Failed to create API key', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_usage',
      description: 'Current usage snapshot for the active organization: plan, user count, agent count, token usage, limits.',
      inputSchema: { type: 'object', properties: { org_id: { type: 'number' } } },
      execute: async (params) => {
        try {
          const orgId = resolveOrgId(params.org_id as number);
          if (!orgId) return err('No active organization.');
          const response = await apiClient.get<UsageSnapshot>(
            `/api/organizations/${orgId}/usage`,
          );
          return ok(response.data);
        } catch (e) {
          return err('Failed to get usage', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'open_org_settings',
      description: 'Take the user to the org settings page (members / invitations / API keys / usage) where they can perform destructive actions themselves.',
      inputSchema: {
        type: 'object',
        properties: {
          org_id: { type: 'number' },
          tab: { type: 'string', enum: ['members', 'invitations', 'api-keys', 'usage'] },
        },
      },
      execute: (params) => {
        const orgId = resolveOrgId(params.org_id as number);
        if (!orgId) return err('No active organization.');
        const tab = (params.tab as string) || 'members';
        const path = `/organizations/${orgId}/settings?section=${tab}`;
        navigate(path);
        return ok({ navigated_to: path });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default OrgToolsRegistrar;
