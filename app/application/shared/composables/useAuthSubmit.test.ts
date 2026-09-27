import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { useAuthSubmit } from './useAuthSubmit'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useAuthSubmit', () => {
  it('starts with a clean state', () => {
    const { isSubmitting, errorMessage, fieldErrors } = useAuthSubmit({
      request: vi.fn(),
      mapError: vi.fn(),
    })

    expect(isSubmitting.value).toBe(false)
    expect(errorMessage.value).toBeNull()
    expect(fieldErrors.value).toBeNull()
  })

  it('on success, calls request with the credentials, saves the session and resolves true', async () => {
    const request = vi.fn().mockResolvedValue({
      user: { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatar_url: null, created_at: '2026-01-01' },
      token: 'abc123',
    })
    const { submit } = useAuthSubmit({ request, mapError: vi.fn() })

    const result = await submit({ email: 'ada@example.com', password: 'password' })

    expect(request).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password' })
    expect(result).toBe(true)

    const authStore = useAuthStore()
    expect(authStore.token).toBe('abc123')
    expect(authStore.user).toEqual({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatarUrl: null })
  })

  it('on error, delegates to mapError and resolves false', async () => {
    const error = new Error('boom')
    const request = vi.fn().mockRejectedValue(error)
    const mapError = vi.fn().mockReturnValue({ message: 'Something went wrong.', fieldErrors: { email: ['invalid'] } })

    const { submit, errorMessage, fieldErrors } = useAuthSubmit({ request, mapError })
    const result = await submit({})

    expect(mapError).toHaveBeenCalledWith(error)
    expect(result).toBe(false)
    expect(errorMessage.value).toBe('Something went wrong.')
    expect(fieldErrors.value).toEqual({ email: ['invalid'] })
  })

  it('sets isSubmitting while the request is pending', async () => {
    let resolveRequest!: (value: { user: { id: number, name: string, email: string, avatar_url: string | null, created_at: string }, token: string }) => void
    const request = vi.fn().mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))

    const { submit, isSubmitting } = useAuthSubmit({ request, mapError: vi.fn() })
    const pending = submit({})

    expect(isSubmitting.value).toBe(true)

    resolveRequest({
      user: { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatar_url: null, created_at: '2026-01-01' },
      token: 'abc123',
    })
    await pending

    expect(isSubmitting.value).toBe(false)
  })
})
