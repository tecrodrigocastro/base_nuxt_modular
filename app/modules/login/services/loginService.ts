import { httpClient, HttpClientError } from '@/infrastructure/http/HttpClient'
import { LoginError } from './loginError'
import type { LoginCredentials } from '../types'

const LOGIN_URL = '/auth/login'

interface LoginUserPayload {
  id: number
  name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export interface LoginPayload {
  user: LoginUserPayload
  token: string
}

function handleError(error: unknown): never {
  if (error instanceof HttpClientError) {
    throw new LoginError(error.message, error.statusCode, error.fieldErrors)
  }

  throw new LoginError('Could not log in right now. Please try again.')
}

// Only talks to the backend — no response translation happens here, that's
// the composable's job. See docs/ARCHITECTURE.md, "services/".
export default {
  async login(credentials: LoginCredentials): Promise<LoginPayload> {
    try {
      return await httpClient.post<LoginPayload>(LOGIN_URL, {
        body: { email: credentials.email, password: credentials.password },
      })
    } catch (error) {
      handleError(error)
    }
  },
}
