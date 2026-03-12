// ============================================================
// Type Definitions for the Flunkie Platform
// ============================================================

/** A registered user in the system */
export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  onboarding_completed: boolean;
}

/** Zustand auth store shape - manages user session state */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

/** An agent linked to a user's website */
export interface Chatbot {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  website_url: string | null;
  status: 'pending' | 'crawling' | 'ready' | 'error' | 'active';
  is_active: boolean;
  created_at: string;
  crawl_jobs?: CrawlJob[];
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
  widget_header_color?: string | null;
  widget_user_bubble_color?: string | null;
  widget_assistant_bubble_color?: string | null;
  widget_font_family?: string | null;
  widget_font_size?: number | null;
  widget_text_color?: string | null;
  voice_enabled?: boolean;
  webmcp_enabled?: boolean;
  mcp_servers?: MCPServer[] | null;
  person_mode_enabled?: boolean;
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
  widget_header_color?: string | null;
  widget_user_bubble_color?: string | null;
  widget_assistant_bubble_color?: string | null;
  widget_font_family?: string | null;
  widget_font_size?: number | null;
  widget_text_color?: string | null;
  voice_enabled?: boolean;
  webmcp_enabled?: boolean;
  mcp_servers?: MCPServer[] | null;
  person_mode_enabled?: boolean;
}

/** A crawl job that indexes a website's content */
export interface CrawlJob {
  id: number;
  chatbot_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  pages_crawled: number;
  started_at: string;
  completed_at?: string;
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
