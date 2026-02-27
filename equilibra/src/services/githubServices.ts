const API_BASE = '/api';

export interface GithubUserSearchResult {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GithubRepoSearchResult {
  full_name: string;
  private: boolean;
  html_url: string;
}

export const searchGithubUsers = async (query: string): Promise<GithubUserSearchResult[]> => {
  const normalized = query.trim();
  if (normalized.length < 2) return [];

  const resp = await fetch(`${API_BASE}/github/users/search?query=${encodeURIComponent(normalized)}`, {
    credentials: 'include',
  });

  if (!resp.ok) {
    const message = await resp.text();
    throw new Error(message || `GitHub user search failed with ${resp.status}`);
  }

  const payload = (await resp.json()) as { items: GithubUserSearchResult[] };
  return payload.items ?? [];
};

export const searchGithubRepositories = async (query: string): Promise<GithubRepoSearchResult[]> => {
  const normalized = query.trim();
  if (normalized.length < 2) return [];

  const resp = await fetch(`${API_BASE}/github/repos/search?query=${encodeURIComponent(normalized)}`, {
    credentials: 'include',
  });

  if (!resp.ok) {
    const message = await resp.text();
    throw new Error(message || `GitHub repository search failed with ${resp.status}`);
  }

  const payload = (await resp.json()) as { items: GithubRepoSearchResult[] };
  return payload.items ?? [];
};
