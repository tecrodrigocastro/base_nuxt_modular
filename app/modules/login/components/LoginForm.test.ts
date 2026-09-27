import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useLogin } from '../composables/useLogin'
import LoginForm from './LoginForm.vue'

vi.mock('../composables/useLogin', () => ({
  useLogin: vi.fn(),
}))

function mockUseLogin(overrides: { submit?: ReturnType<typeof vi.fn>, isSubmitting?: boolean, errorMessage?: string | null } = {}) {
  const mocked = {
    isSubmitting: ref(overrides.isSubmitting ?? false),
    errorMessage: ref(overrides.errorMessage ?? null),
    fieldErrors: ref(null),
    submit: overrides.submit ?? vi.fn().mockResolvedValue(true),
  }
  vi.mocked(useLogin).mockReturnValue(mocked as unknown as ReturnType<typeof useLogin>)
  return mocked
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  it('renders the email and password fields', async () => {
    mockUseLogin()
    const wrapper = await mountSuspended(LoginForm)

    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bem-vindo de volta')
  })

  it('blocks submit and shows validation errors when fields are empty', async () => {
    const submit = vi.fn()
    mockUseLogin({ submit })
    const wrapper = await mountSuspended(LoginForm)

    await wrapper.find('form').trigger('submit.prevent')

    expect(submit).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Email não pode ser vazio')
    expect(wrapper.text()).toContain('Senha não pode ser vazia')
  })

  it('shows an invalid email error for a malformed address', async () => {
    mockUseLogin()
    const wrapper = await mountSuspended(LoginForm)

    await wrapper.find('#email').setValue('not-an-email')
    await wrapper.find('#email').trigger('blur')

    expect(wrapper.text()).toContain('Email inválido')
  })

  it('calls submit with the typed credentials and emits success', async () => {
    const submit = vi.fn().mockResolvedValue(true)
    mockUseLogin({ submit })
    const wrapper = await mountSuspended(LoginForm)

    await wrapper.find('#email').setValue('ada@example.com')
    await wrapper.find('#password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(submit).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password' })
    expect(wrapper.emitted('success')).toHaveLength(1)
  })

  it('does not emit success when submit resolves false', async () => {
    const submit = vi.fn().mockResolvedValue(false)
    mockUseLogin({ submit })
    const wrapper = await mountSuspended(LoginForm)

    await wrapper.find('#email').setValue('ada@example.com')
    await wrapper.find('#password').setValue('wrong')
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.emitted('success')).toBeUndefined()
  })

  it('shows the composable error message', async () => {
    mockUseLogin({ errorMessage: 'E-mail ou senha inválidos.' })
    const wrapper = await mountSuspended(LoginForm)

    expect(wrapper.text()).toContain('E-mail ou senha inválidos.')
  })

  it('disables the submit button while submitting', async () => {
    mockUseLogin({ isSubmitting: true })
    const wrapper = await mountSuspended(LoginForm)

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Entrando…')
  })

  it('toggles the password field visibility', async () => {
    mockUseLogin()
    const wrapper = await mountSuspended(LoginForm)

    const passwordInput = wrapper.find('#password')
    expect(passwordInput.attributes('type')).toBe('password')

    await wrapper.findAll('button[type="button"]')[0]?.trigger('click')

    expect(passwordInput.attributes('type')).toBe('text')
  })
})
