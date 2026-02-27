import { createContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { fetchCurrentUser, postLogout, postSyncUser, type GitHubUser } from "./api"

interface AuthState {
    user: GitHubUser | null
    isLoading: boolean
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
    // Use server-backed session: always fetch fresh user on load and on refresh.
    const [user, setUser] = useState<GitHubUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshUser = useCallback(async () => {
        const nextUser = await fetchCurrentUser().catch(() => null)
        if (!nextUser) {
            setUser(null)
            return
        }

        const dbUser = await postSyncUser().catch(() => null)
        setUser({ ...nextUser, db_user: dbUser ?? nextUser.db_user })
    }, [])

    useEffect(() => {
        let isDisposed = false

        void fetchCurrentUser()
            .then(async nextUser => {
                if (isDisposed) return
                if (!nextUser) {
                    setUser(null)
                    return
                }

                const dbUser = await postSyncUser().catch(() => null)
                if (isDisposed) return
                setUser({ ...nextUser, db_user: dbUser ?? nextUser.db_user })
            })
            .catch(() => {
                if (isDisposed) return
                setUser(null)
            })
            .finally(() => {
                if (isDisposed) return
                setIsLoading(false)
            })

        return () => {
            isDisposed = true
        }
    }, [])

    async function logout() {
        await postLogout()
        setUser(null)
    }

    return <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export {AuthContext, AuthProvider}