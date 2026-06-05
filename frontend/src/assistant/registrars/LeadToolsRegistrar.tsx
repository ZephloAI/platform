import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import { getLeads } from '../../api/leads';
import { describeError, err, ok } from '../util';

// Lead tools.
// There is no backend "export" endpoint — `export_leads` returns a CSV
// rendered client-side from the same data the Leads UI shows, so the
// numbers always match what the user sees.

interface Props {
  instance: ZephloInstance;
}

function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function LeadToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    instance.registerTool({
      name: 'list_leads',
      description: 'List the leads captured for an agent (name, email, phone, company, interest).',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          only_complete: { type: 'boolean', description: 'Only return leads with both name and email.' },
          ...navigateProp,
        },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          let leads = await getLeads(params.agent_id as string);
          if (params.only_complete) {
            leads = leads.filter((l) => !!l.name && !!l.email);
          }
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=leads`);
          return ok({ count: leads.length, leads });
        } catch (e) {
          return err('Failed to list leads', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'export_leads_csv',
      description: 'Export all leads for an agent as a CSV string. The caller can copy it into a file.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const leads = await getLeads(params.agent_id as string);
          const csv = toCsv(leads as unknown as Record<string, unknown>[], [
            'name', 'email', 'phone', 'company', 'interest', 'created_at',
          ]);
          return ok({ csv, count: leads.length });
        } catch (e) {
          return err('Failed to export leads', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default LeadToolsRegistrar;
