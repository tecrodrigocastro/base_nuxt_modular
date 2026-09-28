# base_nuxt_modular

Nuxt 4 template with a module-per-feature convention (`app/modules/{name}/`: types → services → composables → components → views), extracted from a real production app's own `docs/ARCHITECTURE.md`. Meant to be cloned/copied as the starting point for a new frontend, not extended into a product itself — same spirit as [`base_clean_arch_bloc`](../base_clean_arch_bloc) (Flutter) and [`base_laravel_modular`](../base_laravel_modular) (the Laravel monorepo this frontend is designed to sit next to as `apps/web`).

Full layer rules live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — read that first, it's the actual convention document, not a summary. `.claude/rules/` covers what's specific to this being a template (which module is the reference, why `HttpClient` is shaped the way it is, the two different reasons something is "shared").

`app/modules/login/` is the reference module — a complete, working example of every layer, with tests for each. Imitate its shape when creating a new module.

## Structure

```
app/
  application/
    locales/pt-br/index.ts        # aggregates every module's locale — one import+key per module
    shared/
      composables/                 # cross-cutting, not owned by one module (useLogout, useAuthSubmit)
      services/                    # backend calls not owned by one module (authService)
  infrastructure/
    http/HttpClient.ts             # the only place that calls fetch() — Bearer auth, Laravel-shaped errors
  modules/
    login/                         # reference module
      types/index.ts
      services/{loginService,loginError}.ts
      composables/useLogin.ts
      components/LoginForm.vue
      views/LoginView.vue
      locales/pt-br/index.ts
      router/index.ts              # documental — Nuxt file-based routing resolves navigation today
  stores/
    authStore.ts                   # the one legitimate global (Pinia) store — session data
  pages/
    login.vue                      # wires the login module into Nuxt's file-based router
    index.vue
  plugins/
    auth.client.ts                 # hydrates authStore from localStorage on boot
e2e/
  login.spec.ts                    # Playwright — real browser, mocks only the network boundary
```

## Commands

```bash
npm install
npx playwright install chromium   # once, downloads the browser Playwright drives
cp .env.example .env
npm run dev
npm test              # vitest run — every module ships layer-by-layer tests, see login/
npm run test:e2e      # playwright test — real browser, see e2e/login.spec.ts
npm run test:e2e:ui   # same, with Playwright's interactive UI mode (watch it click through the app)
npm run typecheck     # nuxt typecheck (vue-tsc)
```

## Non-negotiables

- A module's `services/` never translates the API response — only the composable does. See `docs/ARCHITECTURE.md`, "Layers".
- A module's `views/` never calls a service directly — that's a component/composable's job.
- No per-module Pinia store. Global state (`app/stores/`) is only for things genuinely read across unrelated parts of the app — `authStore` is the reference example. See `.claude/rules/architecture.md`, "Two different reasons a piece of code is 'shared'".
- Every module with a view is registered in Nuxt's file-based routing (`app/pages/`) and in `app/application/locales/pt-br/index.ts` — both, every time.
- **A screen/form-flow change is not verified by `npm test` alone.** Run `npm run test:e2e` (or extend `e2e/*.spec.ts` for the flow you touched) before considering it done — Vitest's component tests mock `useLogin()`/the composable entirely, so they can't catch a broken hydration, a missing `aria-label`, or a redirect that silently stopped firing. See `.claude/rules/architecture.md`, "Testing".

## UI kit

[DaisyUI](https://daisyui.com/) is wired in `app/assets/css/main.css` via `@plugin 'daisyui';` (Tailwind v4 CSS-first config, no JS config file). `LoginForm.vue` demonstrates the intended usage: `fieldset`/`fieldset-legend`/`label` for form fields, `input`/`input-error`, `btn`/`btn-primary`/`btn-ghost`, `alert`/`alert-error` — component classes, not raw utilities, for anything that's a form control, button, or alert. See `.claude/rules/architecture.md`, "UI kit: DaisyUI".

## Why the backend error shape is opinionated

`HttpClient.ts` expects a Laravel-style `{message, errors}` JSON body on non-2xx responses, and Bearer-token auth matching a Sanctum-style `{user, token}` login response. This isn't generic REST client boilerplate — it's built to pair with `base_laravel_modular`'s `apps/backend`. See `.claude/rules/architecture.md` for what that backend still needs to build (`POST /auth/login`, `POST /auth/logout`) before this frontend's `login` module is more than a working shape.

## Roadmap (not built yet)

- No generator/skill scaffolding a new module (`base_laravel_modular` has `make new-module` wrapping a real Composer package generator; there's no equivalent tool for a Nuxt module — creating one is by hand, following `login`'s shape and `docs/ARCHITECTURE.md`).
- `register` (the natural second consumer of `useAuthSubmit`, alongside `login`) isn't built — only documented as the reason `useAuthSubmit` exists as a shared composable rather than living inside `login/`.
- No navigation chrome (sidebar/navbar) yet — the "register every module's view in it" step from `docs/ARCHITECTURE.md`'s checklist has nothing to register into today.
- `apps/backend`'s Sanctum-shaped `/auth/login`/`/auth/logout` endpoints (see above) — needed for this app to talk to a real backend instead of just having the client-side shape ready.

Done: `npm test` passes (40 tests across 7 files, one per layer of the reference module plus the shared composables and `HttpClient`); `npm run test:e2e` passes (6 Playwright cases covering `login`'s full user-facing behavior in a real browser, network mocked at the `fetch` boundary); `npm run typecheck` passes; `npm run build` produces a working production build.
