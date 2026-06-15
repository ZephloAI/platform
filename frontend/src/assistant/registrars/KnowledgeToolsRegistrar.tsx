import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import {
  useRecrawl,
  useCreateText,
  useUpdateText,
} from '../../hooks/useChatbots';
import { describeError, err, ok } from '../util';

// Knowledge base tools: site discovery, recrawl, raw text snippets, doc listing.
// File uploads (docs, logo) can't pass through the LLM directly — for those
// the assistant should call `open_upload_document` to put the user in front
// of the upload form themselves.

interface Props {
  instance: ZephloInstance;
}

function KnowledgeToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const recrawl = useRecrawl();
  const createText = useCreateText();
  const updateText = useUpdateText();

  useEffect(() => {
    // ---------- Discovery (selection + crawl happen in the UI) ----------
    // Adding a website is a guided flow: this tool opens the Knowledge → Website
    // tab and starts discovery there, so the user reviews the discovered pages in
    // the visual selector, deselects any they don't want, and clicks Crawl. The
    // assistant never crawls a website directly — that would skip page selection.
    instance.registerTool({
      name: 'discover_pages',
      description:
        'Add a website as a knowledge source. Opens the agent\'s Knowledge → Website tab and starts discovering the site\'s pages so the user can review them, deselect any they don\'t want, and crawl the selected ones. Use this whenever a user wants to add a website/site as a knowledge source. NEVER crawl a website directly — always start here so the user can pick pages.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          website_url: { type: 'string', description: 'The website to discover pages for.' },
        },
        required: ['agent_id', 'website_url'],
      },
      execute: (params) => {
        const agentId = params.agent_id as string;
        const websiteUrl = params.website_url as string;
        const path =
          `/agents/${agentId}?section=knowledge&knowledgeTab=website` +
          `&discoverUrl=${encodeURIComponent(websiteUrl)}`;
        navigate(path);
        return ok({
          navigated_to: path,
          hint: 'Discovery has started in the Website tab. Ask the user to review the discovered pages, deselect any they don\'t want, and click Crawl.',
        });
      },
    });

    instance.registerTool({
      name: 'recrawl',
      description: 'Re-crawl a website that was already set up, using the agent\'s previously stored URLs (no discovery needed). Only use this to refresh an existing knowledge source — to add a NEW website, use discover_pages instead.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' }, ...navigateProp },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const job = await recrawl.mutateAsync(params.agent_id as string);
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=knowledge`);
          return ok({ job_id: job.id, status: job.status });
        } catch (e) {
          return err('Failed to recrawl', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'get_crawl_status',
      description: 'Return the status of every crawl job for an agent.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          const jobs = agent.crawl_jobs || [];
          if (jobs.length === 0) return ok({ jobs: [], message: 'No crawl jobs yet.' });
          return ok({
            jobs: jobs.map((j) => ({
              id: j.id,
              status: j.status,
              pages_crawled: j.pages_crawled,
              started_at: j.started_at,
            })),
          });
        } catch (e) {
          return err('Failed to get crawl status', describeError(e));
        }
      },
    });

    // ---------- Documents ----------
    instance.registerTool({
      name: 'list_documents',
      description: 'List PDFs uploaded to an agent\'s knowledge base.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok(agent.documents || []);
        } catch (e) {
          return err('Failed to list documents', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'open_upload_document',
      description: 'Take the user to the Knowledge page so they can upload a PDF themselves. Use this whenever a PDF needs to be added — the assistant cannot upload files directly.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: (params) => {
        const path = `/agents/${params.agent_id}?section=knowledge`;
        navigate(path);
        return ok({ navigated_to: path, hint: 'User can drop a PDF on the upload area here.' });
      },
    });

    // ---------- Raw text snippets ----------
    instance.registerTool({
      name: 'list_texts',
      description: 'List raw text snippets in an agent\'s knowledge base.',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string' } },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agent = await chatbotApi.getChatbot(params.agent_id as string);
          return ok(agent.agent_texts || []);
        } catch (e) {
          return err('Failed to list texts', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'add_text',
      description: 'Add a raw text snippet (with title) to an agent\'s knowledge base. Useful for short FAQs, policies, or facts the assistant should know.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          ...navigateProp,
        },
        required: ['agent_id', 'title', 'content'],
      },
      execute: async (params) => {
        try {
          const text = await createText.mutateAsync({
            chatbotId: params.agent_id as string,
            title: params.title as string,
            content: params.content as string,
          });
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=knowledge`);
          return ok({ id: text.id, title: text.title });
        } catch (e) {
          return err('Failed to add text', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'update_text',
      description: 'Update an existing text snippet\'s title or content.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          text_id: { type: 'number' },
          title: { type: 'string' },
          content: { type: 'string' },
          ...navigateProp,
        },
        required: ['agent_id', 'text_id', 'title', 'content'],
      },
      execute: async (params) => {
        try {
          const text = await updateText.mutateAsync({
            chatbotId: params.agent_id as string,
            textId: params.text_id as number,
            title: params.title as string,
            content: params.content as string,
          });
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=knowledge`);
          return ok({ id: text.id, title: text.title });
        } catch (e) {
          return err('Failed to update text', describeError(e));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  return null;
}

export default KnowledgeToolsRegistrar;
