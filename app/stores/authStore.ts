import { defineStore } from 'pinia'
import { httpClient } from '@/infrastructure/http/HttpClient'

const STORAGE_KEY = 'app.auth'

export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  avatarUrl: string | null
}

interface AuthState {
  user: AuthenticatedUser | null
  token: string | null
}

interface StoredSession {
  user: AuthenticatedUser
  token: string
}

/**
 * One of the few legitimate global (Pinia) stores — session state is read
 * by unrelated parts of the app (navigation, any authenticated request),
 * not scoped to one screen/module. See docs/ARCHITECTURE.md, "Estado global".
 */
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
  }),

  getters: {
    isAuthenticated: (state) => state.token !== null,
  },

  actions: {
    setSession(user: AuthenticatedUser, token: string) {
      this.user = user
      this.token = token
      httpClient.setAuthToken(token)

      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token } satisfies StoredSession))
      }
    },

    clearSession() {
      this.user = null
      this.token = null
      httpClient.setAuthToken(null)

      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    hydrate() {
      if (!import.meta.client) {
        return
      }

      const raw = localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        return
      }

      try {
        const stored = JSON.parse(raw) as StoredSession
        this.user = stored.user
        this.token = stored.token
        httpClient.setAuthToken(stored.token)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
  },
})
