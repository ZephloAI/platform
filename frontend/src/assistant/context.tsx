import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOrgStore } from '../stores/orgStore';
import type { Chatbot } from '../types';

// ============================================================
// AssistantContext
// Tracks "what the user is currently looking at" so the dashboard
// assistant always knows the page, section, selected agent, etc.
//
// Pages set their slice of context via useAssistantContext().
// The single AssistantContextEmitter (mounted in DashboardAssistant)
// reads the combined context plus React Router + auth + org stores,
// and forwards it to Zephlo via Zephlo.sendContextUpdate.
// ============================================================

export type AssistantPageContext = {
  page?: string;                        // e.g. 'agent_detail', 'organization_settings'
  section?: string;                     // e.g. 'knowledge', 'config'
  tab?: string;                         // e.g. 'appearance', 'quick-prompts'
  agent?: Chatbot | null;               // selected agent on agent pages
  availableActions?: string[];          // tool names the LLM may consider here
  formState?: Record<string, unknown>;  // dirty form fields, if any
};

type SetContext = (patch: AssistantPageContext) => void;
type ResetContext = () => void;

interface AssistantContextValue {
  context: AssistantPageContext;
  setContext: SetContext;
  resetContext: ResetContext;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<AssistantPageContext>({});

  const setContext = useCallback((patch: AssistantPageContext) => {
    setContextState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetContext = useCallback(() => {
    setContextState({});
  }, []);

  const value = useMemo(() => ({ context, setContext, resetContext }), [context, setContext, resetContext]);

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

/**
 * Pages call this to merge their slice into the assistant context.
 * Pass any subset of fields — they shallow-merge into the existing context.
 */
export function useAssistantContext() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error('useAssistantContext must be used inside <AssistantContextProvider>');
  }
  return ctx;
}

/**
 * Hook variant for pages: set a slice on mount, reset on unmount.
 * Re-runs when `deps` change so dynamic values (e.g. selected agent) stay current.
 */
export function useSetAssistantContext(patch: AssistantPageContext, deps: unknown[] = []) {
  const { setContext } = useAssistantContext();
  useEffect(() => {
    setContext(patch);
    // We intentionally don't reset — the next page setting its own context overrides.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ----------------------------------------------------------------
// Read-only snapshot used by the emitter to assemble the WS payload.
// Pulls user + org from their respective stores, page slice from context.
// ----------------------------------------------------------------
export function useAssistantContextSnapshot() {
  const { context } = useAssistantContext();
  const { user } = useAuth();
  const activeOrg = useOrgStore((state) => state.activeOrganization);
  const location = useLocation();

  return useMemo(() => {
    return {
      route: location.pathname + (location.search || ''),
      page: context.page,
      section: context.section,
      tab: context.tab,
      user: user
        ? {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            full_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
            // `name` is the conversational handle the LLM should use — first
            // name when we have it, otherwise the local part of the email.
            name: user.first_name || user.email?.split('@')[0] || null,
          }
        : null,
      org: activeOrg
        ? { id: activeOrg.id, name: activeOrg.name, role: activeOrg.role }
        : null,
      agent: context.agent
        ? {
            id: context.agent.public_id,
            name: context.agent.name,
            status: context.agent.status,
            website_url: context.agent.website_url,
            documents_count: context.agent.documents?.length ?? 0,
            texts_count: context.agent.agent_texts?.length ?? 0,
            has_crawl: !!context.agent.crawl_jobs?.length,
          }
        : null,
      available_actions: context.availableActions,
      form_state: context.formState,
    };
  }, [context, user, activeOrg, location.pathname, location.search]);
}

// ----------------------------------------------------------------
// AssistantContextEmitter
// Mount once (inside DashboardAssistant). Debounces context changes
// and forwards via the provided sender (Zephlo.sendContextUpdate).
// ----------------------------------------------------------------
type Sender = (payload: Record<string, unknown>) => void;

export function useEmitAssistantContext(send: Sender | null, debounceMs = 300) {
  const snapshot = useAssistantContextSnapshot();
  const timerRef = useRef<number | null>(null);
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!send) return;

    const payload = snapshot as Record<string, unknown>;
    const serialised = JSON.stringify(payload);
    if (serialised === lastSentRef.current) return;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      lastSentRef.current = serialised;
      send(payload);
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [snapshot, send, debounceMs]);
}
