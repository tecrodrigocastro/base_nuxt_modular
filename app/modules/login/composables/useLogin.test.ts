import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import loginService from '../services/loginService'
import { LoginError } from '../services/loginError'
import { useLogin } from './useLogin'

vi.mock('../services/loginService', () => ({
  default: { login: vi.fn() },
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useLogin', () => {
  it('starts with a clean state', () => {
    const { isSubmitting, errorMessage, fieldErrors } = useLogin()

    expect(isSubmitting.value).toBe(false)
    expect(errorMessage.value).toBeNull()
    expect(fieldErrors.value).toBeNull()
  })

  it('on success, saves the session in authStore and resolves true', async () => {
    vi.mocked(loginService.login).mockResolvedValueOnce({
      user: { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatar_url: null, created_at: '2026-01-01' },
      token: 'abc123',
    })

    const { submit, isSubmitting, errorMessage } = useLogin()
    const result = await submit({ email: 'ada@example.com', password: 'password' })

    expect(result).toBe(true)
    expect(isSubmitting.value).toBe(false)
    expect(errorMessage.value).toBeNull()

    const authStore = useAuthStore()
    expect(authStore.token).toBe('abc123')
    expect(authStore.user).toEqual({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatarUrl: null })
  })

  it('maps a 401 to the invalid credentials message', async () => {
    vi.mocked(loginService.login).mockRejectedValueOnce(new LoginError('bad creds', 401))

    const { submit, errorMessage } = useLogin()
    const result = await submit({ email: 'x@x.com', password: 'wrong' })

    expect(result).toBe(false)
    expect(errorMessage.value).toBe('E-mail ou senha inválidos.')
  })

  it('maps a 429 to the rate limit message', async () => {
    vi.mocked(loginService.login).mockRejectedValueOnce(new LoginError('too many', 429))

    const { submit, errorMessage } = useLogin()
    await submit({ email: 'x@x.com', password: 'y' })

    expect(errorMessage.value).toBe('Muitas tentativas seguidas. Espere um pouco e tente de novo.')
  })

  it('maps a 422 to the first field error message', async () => {
    vi.mocked(loginService.login).mockRejectedValueOnce(
      new LoginError('validation failed', 422, { email: ['O campo email é obrigatório.'] }),
    )

    const { submit, errorMessage, fieldErrors } = useLogin()
    await submit({ email: '', password: 'y' })

    expect(errorMessage.value).toBe('O campo email é obrigatório.')
    expect(fieldErrors.value).toEqual({ email: ['O campo email é obrigatório.'] })
  })

  it('falls back to a generic message for unexpected errors', async () => {
    vi.mocked(loginService.login).mockRejectedValueOnce(new Error('boom'))

    const { submit, errorMessage } = useLogin()
    await submit({ email: 'x@x.com', password: 'y' })

    expect(errorMessage.value).toBe('Não deu para entrar agora. Tente de novo.')
  })

  it('sets isSubmitting while the request is pending', async () => {
    let resolveLogin!: (value: Awaited<ReturnType<typeof loginService.login>>) => void
    vi.mocked(loginService.login).mockReturnValueOnce(new Promise((resolve) => { resolveLogin = resolve }))

    const { submit, isSubmitting } = useLogin()
    const pending = submit({ email: 'x@x.com', password: 'y' })

    expect(isSubmitting.value).toBe(true)

    resolveLogin({
      user: { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatar_url: null, created_at: '2026-01-01' },
      token: 'abc123',
    })
    await pending

    expect(isSubmitting.value).toBe(false)
  })
})
