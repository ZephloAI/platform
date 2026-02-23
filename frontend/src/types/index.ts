// ============================================================
// Type Definitions for the Chatbot Platform
// ============================================================

/** A registered user in the system */
export interface User {
  id: number;
  email: string;
}

/** Zustand auth store shape - manages user session state */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/** A chatbot linked to a user's website */
export interface Chatbot {
  id: number;
  name: string;
  website_url: string | null;
  status: 'pending' | 'crawling' | 'ready' | 'error';
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
