// ============================================================
// Type Definitions for the Zephlo Platform
// ============================================================

/** A single day's count for time-series charts */
export interface DailyDataPoint {
  date: string;
  count: number;
}

/** Daily time-series analytics for an organization */
export interface OrgAnalytics {
  messages_per_day: DailyDataPoint[];
  conversations_per_day: DailyDataPoint[];
  resolved_per_day: DailyDataPoint[];
  unique_visitors_per_day: DailyDataPoint[];
}

/** Per-chatbot metrics keyed by chatbot ID */
export interface ChatbotMetricsMap {
  metrics: Record<number, {
    total_conversations: number;
    total_messages: number;
    resolved_requests: number;
  }>;
}

/** Compact per-chatbot daily analytics for sparklines */
export interface ChatbotMiniAnalytics {
  messages: DailyDataPoint[];
  conversations: DailyDataPoint[];
  resolved: DailyDataPoint[];
}

/** A registered user in the system */
export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  onboarding_completed: boolean;
  is_platform_admin?: boolean;
}

/** Current usage vs. limits for an organization */
export interface UsageSnapshot {
  organization_id: number;
  plan: string;
  is_suspended: boolean;
  users_count: number;
  pending_invites_count: number;
  agents_count: number;
  tokens_used_in_period: number;
  max_users: number | null;
  max_agents: number | null;
  max_tokens_per_period: number | null;
  /** null when max_users is null (unlimited). */
  seats_remaining: number | null;
  token_period: string;
  token_period_start: string | null;
}

/** A row in the admin "list all orgs" view */
export interface OrgAdminSummary extends UsageSnapshot {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

/** A single entry in an organization's audit log */
export interface AuditLogEntry {
  id: number;
  organization_id: number | null;
  actor_user_id: number | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
}

/** Platform-wide metrics on the admin overview */
export interface PlatformMetrics {
  active_orgs: number;
  suspended_orgs: number;
  total_orgs: number;
  total_agents: number;
  total_users: number;
  tokens_last_30_days: number;
}

/** One point in the platform token-usage time series */
export interface TokenUsagePoint {
  date: string;
  total_tokens: number;
}

/** One agent row in the admin per-org agents list */
export interface AdminAgent {
  public_id: string;
  name: string;
  /** Null means the agent uses the global LLM_MODEL default */
  llm_model: string | null;
}

/** Zustand auth store shape - manages user session state */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    invitationToken?: string,
  ) => Promise<void>;
  oauthLogin: (provider: string, idToken: string, invitationToken?: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

/** An agent linked to a user's website */
export interface Chatbot {
  id: number;
  public_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  /** Per-agent LLM model override; null means the global LLM_MODEL default */
  llm_model?: string | null;
  website_url: string | null;
  status: 'pending' | 'crawling' | 'ready' | 'error' | 'active';
  is_active: boolean;
  created_at: string;
  crawl_jobs?: CrawlJob[];
  // Previously crawled URLs (detail response only); used to seed re-discovery on re-crawl.
  crawled_urls?: string[] | null;
  widget_icon: string | null;
  widget_welcome: string | null;
  widget_position: string | null;
  quick_prompts?: QuickPrompt[] | null;
  follow_up_prompts?: FollowUpPrompt[] | null;
  greeting_prompts?: GreetingPrompt[] | null;
  greeting_prompt_duration?: number | null;
  widget_logo_url?: string | null;
  widget_width?: number | null;
  widget_height?: number | null;
  widget_font_family?: string | null;
  widget_font_size?: number | null;
  voice_enabled?: boolean;
  webmcp_enabled?: boolean;
  mcp_servers?: MCPServer[] | null;
  person_mode_enabled?: boolean;
  navigation_enabled?: boolean;
  lead_capture_enabled?: boolean;
  documents?: Document[];
  agent_texts?: AgentText[];
  auto_recrawl_enabled?: boolean;
  recrawl_interval_hours?: number;
  last_crawled_at?: string | null;
}

/** A lead captured during a chat session. Fields are filled in over time —
 *  the agent calls capture_lead multiple times as it learns more, so each
 *  capture field may be null. A lead is "complete" when name and email
 *  are both set. */
export interface Lead {
  id: number;
  public_id: string;
  chatbot_id: number;
  session_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  interest: string | null;
  created_at: string;
  updated_at: string;
}

/** A quick prompt button shown in the widget */
export interface QuickPrompt {
  title: string;
  link?: string;
  prompt?: string;
}

/** A follow-up prompt the AI can suggest after responses */
export interface FollowUpPrompt {
  title: string;
  description?: string;
  link?: string;
  prompt?: string;
}

/** A greeting prompt bubble shown before the chat opens */
export interface GreetingPrompt {
  title: string;
  prompt: string;
}

/** An MCP server connected to an agent */
export interface MCPServer {
  name: string;
  transport: 'sse' | 'streamable-http';
  url: string;
  headers?: Record<string, string> | null;
  enabled: boolean;
}

/** Widget customization settings */
export interface WidgetSettings {
  widget_icon: string | null;
  widget_welcome: string | null;
  widget_position: string | null;
  quick_prompts?: QuickPrompt[] | null;
  follow_up_prompts?: FollowUpPrompt[] | null;
  greeting_prompts?: GreetingPrompt[] | null;
  greeting_prompt_duration?: number | null;
  widget_logo_url?: string | null;
  widget_width?: number | null;
  widget_height?: number | null;
  widget_font_family?: string | null;
  widget_font_size?: number | null;
  voice_enabled?: boolean;
  webmcp_enabled?: boolean;
  mcp_servers?: MCPServer[] | null;
  person_mode_enabled?: boolean;
  navigation_enabled?: boolean;
}

/** An uploaded PDF document in the knowledge base */
export interface Document {
  id: number;
  chatbot_id: number;
  filename: string;
  s3_url: string;
  file_size: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  chunks_indexed: number;
  uploaded_at: string;
  processed_at: string | null;
}

/** A raw text snippet pasted into the knowledge base */
export interface AgentText {
  id: number;
  chatbot_id: number;
  title: string;
  content: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  chunks_indexed: number;
  created_at: string;
  processed_at: string | null;
}

/** A crawl job that indexes a website's content */
export interface CrawlJob {
  id: number;
  chatbot_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  pages_crawled: number;
  started_at: string;
  completed_at?: string;
  // Present only on the single-job detail endpoint (GET /crawl-jobs/{id}),
  // used for the live per-page view while a crawl is in progress.
  total_pages?: number | null;
  crawled_pages?: DiscoveredUrl[] | null;
}

/** A URL discovered during site discovery */
export interface DiscoveredUrl {
  url: string;
  title: string;
}

/** A single message in a chat conversation */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { url: string; title: string }[];
  follow_up_prompts?: { title: string; link?: string; prompt?: string }[];
}

/** An organization that owns agents and members */
export interface Organization {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  role: string;
}

/** A member of an organization */
export interface OrganizationMember {
  id: number;
  user_id: number;
  email: string;
  role: string;
  joined_at: string;
}

/** An invitation to join an organization */
export interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  send_count?: number;
  last_sent_at?: string | null;
}

/** Public preview of an invitation (shown on accept page before sign-in) */
export interface InvitationPreview {
  email: string;
  role: string;
  status: string;
  expires_at: string;
  is_expired: boolean;
  organization_name: string | null;
  inviter_email: string | null;
}

/** An API key for authenticating SDK/widget requests */
export interface ApiKey {
  id: number;
  organization_id: number;
  chatbot_id?: number;
  key_prefix: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

/** Response when creating a new API key - includes full key shown once */
export interface ApiKeyCreated extends ApiKey {
  key: string;
}

/** A message in a conversation */
export interface ConversationMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  created_at: string;
}

/** A conversation session in the list view */
export interface ConversationSession {
  id: string;
  chatbot_id: number;
  mode: 'ai' | 'person';
  is_unread: boolean;
  created_at: string;
  updated_at: string | null;
  last_message: string | null;
  last_message_at: string | null;
  message_count: number;
}

/** A recent conversation across all agents, for the dashboard feed */
export interface RecentConversation {
  id: string;
  chatbot_id: number;
  chatbot_public_id: string;
  chatbot_name: string;
  mode: 'ai' | 'person';
  is_unread: boolean;
  last_message: string | null;
  last_message_at: string | null;
  updated_at: string | null;
}

/** Full conversation detail with messages */
export interface ConversationDetail {
  id: string;
  chatbot_id: number;
  mode: 'ai' | 'person';
  is_unread: boolean;
  admin_id: number | null;
  created_at: string;
  updated_at: string | null;
  messages: ConversationMessage[];
}
