export interface DatabaseUser {
    id: number
    display_name: string
    created_at: Date
    telegram_chat_id: string
    gh_username: string
    gh_access_token: string
    gh_id: string
    email: string
}

export interface GitHubUser {
    id: number
    login: string
    name: string | null
    email: string | null
    avatar_url: string
    html_url: string
    public_repos: number
    followers: number
    db_user: DatabaseUser
}

// Get current user
export async function fetchCurrentUser(): Promise<GitHubUser | null> {
    const resp = await fetch("/api/auth/me", { credentials: 'include' })
    if (resp.status === 401) return null
    if (!resp.ok) throw new Error(`Unexpected response from /auth/me: ${resp.status}`)

    try {
        const payload = await resp.json()
        return payload as GitHubUser
    } catch {
        throw new Error("Failed to parse /auth/me response")
    }
}

export async function postLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function postSyncUser(): Promise<DatabaseUser | null> {
    const resp = await fetch('/api/auth/sync-user', { method: 'POST', credentials: 'include' })
    if (resp.status === 401) return null
    if (!resp.ok) throw new Error(`Unexpected response from /auth/sync-user: ${resp.status}`)

    try {
        const payload = await resp.json()
        return (payload as DatabaseUser) ?? null
    } catch {
        throw new Error('Failed to parse /auth/sync-user response')
    }
}
