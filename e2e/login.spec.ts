import { expect, test } from '@nuxt/test-utils/playwright'

// The backend is mocked via page.route() — no real API needs to be running.
// This is what actually renders in a browser: layout, hydration, focus/blur
// behavior and real DOM state, which the Vitest component tests (mocking
// the composable) can't catch on their own.
const LOGIN_API = '**/api/v1/auth/login'

test.describe('Login', () => {
  test('renders the login form', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })

    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
  })

  test('shows validation errors on empty submit', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })

    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('Email não pode ser vazio')).toBeVisible()
    await expect(page.getByText('Senha não pode ser vazia')).toBeVisible()
  })

  test('shows an invalid-email error for a malformed address', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })

    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Email').blur()

    await expect(page.getByText('Email inválido')).toBeVisible()
  })

  test('toggles password visibility', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })

    const password = page.getByLabel('Senha', { exact: true })
    await expect(password).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Mostrar senha' }).click()

    await expect(password).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Ocultar senha' })).toBeVisible()
  })

  test('shows an error message on invalid credentials', async ({ page, goto }) => {
    await page.route(LOGIN_API, (route) =>
      route.fulfill({ status: 401, json: { message: 'Unauthenticated.' } }))

    await goto('/login', { waitUntil: 'hydration' })

    await page.getByLabel('Email').fill('ada@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('wrong-password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos.' })).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('logs in and redirects to the home page', async ({ page, goto }) => {
    await page.route(LOGIN_API, (route) =>
      route.fulfill({
        status: 200,
        json: {
          user: { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', avatar_url: null, created_at: '2026-01-01' },
          token: 'e2e-test-token',
        },
      }))

    await goto('/login', { waitUntil: 'hydration' })

    await page.getByLabel('Email').fill('ada@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('correct-password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Ada Lovelace')).toBeVisible()
  })
})
