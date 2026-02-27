import { createContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { fetchCurrentUser, postLogout, type GitHubUser } from "./api"

interface AuthState {
    user: GitHubUser | null
    isLoading: boolean
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [isLoading, setIsLoading] = useState(true)

    const refreshUser = useCallback(async () => {
        const nextUser = await fetchCurrentUser().catch(() => null)
        setUser(nextUser)
    }, [])

    useEffect(() => {
        let isDisposed = false

        void fetchCurrentUser()
            .then(nextUser => {
                if (isDisposed) return
                setUser(nextUser)
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