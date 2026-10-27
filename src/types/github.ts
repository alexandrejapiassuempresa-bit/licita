export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
}

export interface GitHubSyncLog {
  id: string;
  timestamp: string;
  action: 'export_price_bank' | 'export_research' | 'import_price_bank';
  repo: string;
  path: string;
  commitUrl?: string;
  itemsCount: number;
  status: 'success' | 'error';
  message: string;
}

export interface GitHubAuthState {
  token: string | null;
  user: GitHubUser | null;
  selectedRepo: string | null;
  syncLogs: GitHubSyncLog[];
}
