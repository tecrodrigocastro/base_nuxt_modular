import { describe, expect, it, vi } from 'vitest'
import { httpClient, HttpClientError } from '@/infrastructure/http/HttpClient'
import loginService from './loginService'
import { LoginError } from './loginError'

vi.mock('@/infrastructure/http/HttpClient', () => ({
  httpClient: { post: vi.fn() },
  HttpClientError: class extends Error {
    statusCode: number | null
    fieldErrors: Record<string, string[]> | null

    constructor(message: string, statusCode: number | null = null, fieldErrors: Record<string, string[]> | null = null) {
      super(message)
      this.statusCode = statusCode
      this.fieldErrors = fieldErrors
    }
  },
}))

describe('loginService.login', () => {
  it('posts to /auth/login with the given credentials', async () => {
    const payload = {
      user: { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatar_url: null, created_at: '2026-01-01' },
      token: 'abc123',
    }
    vi.mocked(httpClient.post).mockResolvedValueOnce(payload)

    const result = await loginService.login({ email: 'ada@example.com', password: 'password' })

    expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
      body: { email: 'ada@example.com', password: 'password' },
    })
    expect(result).toEqual(payload)
  })

  it('wraps an HttpClientError into a LoginError with the same status and field errors', async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      new HttpClientError('These credentials do not match our records.', 401),
    )

    await expect(loginService.login({ email: 'x@x.com', password: 'wrong' })).rejects.toMatchObject({
      message: 'These credentials do not match our records.',
      statusCode: 401,
    })
    await expect(loginService.login({ email: 'x@x.com', password: 'wrong' })).rejects.toBeInstanceOf(LoginError)
  })

  it('wraps an unexpected error into a generic LoginError', async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('network down'))

    await expect(loginService.login({ email: 'x@x.com', password: 'y' })).rejects.toMatchObject({
      message: 'Could not log in right now. Please try again.',
      statusCode: null,
    })
  })
})
