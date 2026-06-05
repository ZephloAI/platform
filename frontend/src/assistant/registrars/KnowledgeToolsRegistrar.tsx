import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZephloInstance } from 'zephlo';
import { navigateProp } from 'zephlo';
import * as chatbotApi from '../../api/chatbots';
import {
  useStartCrawl,
  useRecrawl,
  useCreateText,
  useUpdateText,
} from '../../hooks/useChatbots';
import { describeError, err, ok } from '../util';

// Knowledge base tools: site discovery, crawl, raw text snippets, doc listing.
// File uploads (docs, logo) can't pass through the LLM directly — for those
// the assistant should call `open_upload_document` to put the user in front
// of the upload form themselves.

interface Props {
  instance: ZephloInstance;
}

function KnowledgeToolsRegistrar({ instance }: Props) {
  const navigate = useNavigate();
  const startCrawl = useStartCrawl();
  const recrawl = useRecrawl();
  const createText = useCreateText();
  const updateText = useUpdateText();

  useEffect(() => {
    // ---------- Discovery + crawl ----------
    instance.registerTool({
      name: 'discover_pages',
      description: 'Discover every page on a website without crawling them. Returns the URL list so the user (or the assistant) can decide which to crawl.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          website_url: { type: 'string' },
          ...navigateProp,
        },
        required: ['agent_id', 'website_url'],
      },
      execute: async (params) => {
        try {
          const result = await chatbotApi.discoverUrls(
            params.agent_id as string,
            params.website_url as string,
          );
          const urls = result.urls.map((u) => u.url);
          if (params.navigate) navigate(`/agents/${params.agent_id}?section=knowledge`);
          return ok({ count: urls.length, urls });
        } catch (e) {
          return err('Discovery failed', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'start_crawl',
      description: 'Start a crawl job. If `selected_urls` is omitted, discovers and crawls every page on `website_url`.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          website_url: { type: 'string', description: 'Used to discover pages when selected_urls is omitted.' },
          selected_urls: { type: 'array', items: { type: 'string' } },
          ...navigateProp,
        },
        required: ['agent_id'],
      },
      execute: async (params) => {
        try {
          const agentId = params.agent_id as string;
          let urls = params.selected_urls as string[] | undefined;
          if (!urls || urls.length === 0) {
            const discovered = await chatbotApi.discoverUrls(agentId, params.website_url as string);
            urls = discovered.urls.map((u) => u.url);
          }
          const job = await startCrawl.mutateAsync({ chatbotId: agentId, selectedUrls: urls });
          if (params.navigate) navigate(`/agents/${agentId}?section=knowledge`);
          return ok({ job_id: job.id, pages: urls.length });
        } catch (e) {
          return err('Failed to start crawl', describeError(e));
        }
      },
    });

    instance.registerTool({
      name: 'recrawl',
      description: 'Re-run the crawl using the agent\'s previously stored URLs (no discovery needed).',
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
