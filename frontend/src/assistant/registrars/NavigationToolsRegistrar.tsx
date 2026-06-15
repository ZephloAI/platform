import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { ok } from '../util';

// The assistant never deletes — instead it navigates the user to the page
// where they can perform the destructive action themselves. This file
// concentrates all "take the user somewhere" tools so the LLM has a single
// obvious choice.

interface Props {
  instance: ZephloInstance;
}

function NavigationToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    instance.registerTool({
      name: 'navigate_to',
      description: [
        'Navigate the user to a page in the dashboard.',
        'Common routes:',
        '  /dashboard                                      — home',
        '  /agents/new                                     — create a new agent',
        '  /agents/{id}?section=general                    — overview / details',
        '  /agents/{id}?section=knowledge                  — knowledge base',
        '  /agents/{id}?section=config&configTab=appearance — widget appearance',
        '  /agents/{id}?section=config&configTab=quick-prompts',
        '  /agents/{id}?section=config&configTab=follow-up-prompts',
        '  /agents/{id}?section=config&configTab=greeting-prompts',
        '  /agents/{id}?section=tools                      — MCP servers',
        '  /agents/{id}?section=conversations              — chats',
        '  /agents/{id}?section=leads                      — captured leads',
        '  /agents/{id}/chat                                — preview chat',
        '  /organizations/{orgId}/settings                  — org settings (members, invites, API keys, usage)',
      ].join('\n'),
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Route path to navigate to.' },
        },
        required: ['path'],
      },
      execute: (params) => {
        const path = params.path as string;
        navigate(path);
        return ok({ navigated_to: path });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default NavigationToolsRegistrar;
