import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginForm from '../components/LoginForm.vue'
import LoginView from './LoginView.vue'

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

const routeQuery = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
mockNuxtImport('useRoute', () => () => ({ query: routeQuery.value }))

beforeEach(() => {
  vi.clearAllMocks()
  routeQuery.value = {}
})

async function submitWith(query: Record<string, unknown>) {
  routeQuery.value = query
  const wrapper = await mountSuspended(LoginView, {
    global: { stubs: { LoginForm: true } },
  })
  await wrapper.findComponent(LoginForm).vm.$emit('success')
}

describe('LoginView', () => {
  it('shows the login form', async () => {
    const wrapper = await mountSuspended(LoginView, {
      global: { stubs: { LoginForm: true } },
    })

    expect(wrapper.findComponent(LoginForm).exists()).toBe(true)
  })

  it('redirects to / when the form emits success', async () => {
    const wrapper = await mountSuspended(LoginView, {
      global: { stubs: { LoginForm: true } },
    })

    await wrapper.findComponent(LoginForm).vm.$emit('success')

    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it('goes back to the internal page passed in ?redirect=', async () => {
    await submitWith({ redirect: '/settings/profile' })
    expect(navigateToMock).toHaveBeenCalledWith('/settings/profile')
  })

  it.each(['https://evil.com', '//evil.com', 'javascript:alert(1)', '/\\evil.com', '/\t/evil.com', '/ /evil.com'])(
    'ignores an external redirect (%s) and falls back to /',
    async (redirect) => {
      await submitWith({ redirect })
      expect(navigateToMock).toHaveBeenCalledWith('/')
    },
  )
})
