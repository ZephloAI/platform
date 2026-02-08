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
  website_url: string;
  status: 'pending' | 'crawling' | 'ready' | 'error';
  created_at: string;
  crawl_jobs?: CrawlJob[];
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

/** A single message in a chat conversation */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { url: string; title: string }[];
}
