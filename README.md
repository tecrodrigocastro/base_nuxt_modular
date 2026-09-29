# base_nuxt_modular

[Versão em português](README.pt-BR.md)

A Nuxt 4 **template** with a module-per-feature convention (`app/modules/{name}/`: types → services → composables → components → views), extracted from a real production app's own architecture document instead of invented from scratch.

This repo is a [GitHub template repository](https://docs.github.com/articles/creating-a-repository-from-a-template) — use the **"Use this template"** button (or `gh repo create my-project --template tecrodrigocastro/base_nuxt_modular`) to start a new frontend with this content and a fresh Git history, not extended into a product itself — same spirit as [`base_clean_arch_bloc`](../base_clean_arch_bloc) (its Flutter counterpart) and [`base_laravel_modular`](../base_laravel_modular), the Laravel monorepo this frontend is designed to sit next to as `apps/web`.

> **Status:** runnable and tested. `login` is a complete, working reference module (types, service + error class, composable, component, view, tests for every layer — unit and end-to-end). 40 unit tests pass, 6 Playwright e2e tests pass, typecheck passes, `npm run build` produces a working production build.

```bash
npm install
npx playwright install chromium   # once — downloads the browser Playwright drives
cp .env.example .env
npm run dev
npm test           # vitest — fast, mocks the composable boundary
npm run test:e2e   # playwright — real browser, mocks only the network
```

> **Working with AI assistants**: this project ships a `CLAUDE.md` and `.claude/rules/` so Claude Code (or any assistant that reads `CLAUDE.md`) already knows the architecture and naming conventions before generating anything.

## The idea

Every feature is a module under `app/modules/{name}/`, with a strict layer separation: `types/` (interfaces only) → `services/` (raw backend calls, no response translation) → `composables/` (state + translation + error mapping) → `components/` (each makes its own requests) → `views/` (orchestration only, no service calls). Full rules: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

`login` is the reference module — imitate its shape when creating a new one. `app/application/shared/` holds cross-cutting composables/services (like `useLogout`) that more than one module needs but that aren't global state; `app/stores/` (Pinia) is reserved for state that's genuinely global — `authStore` is the only one here.

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

## Core rules

- A module's `services/` never translates the API response — only the composable does.
- A module's `views/` never calls a service directly.
- No per-module Pinia store — global state is only for things genuinely read across unrelated parts of the app.
- Every module with a view is registered in Nuxt's file-based routing and in `app/application/locales/pt-br/index.ts`.

Full rationale: [`.claude/rules/architecture.md`](.claude/rules/architecture.md). Naming table: [`.claude/rules/naming-conventions.md`](.claude/rules/naming-conventions.md).

## UI kit

[DaisyUI](https://daisyui.com/) is wired via Tailwind v4's CSS-first plugin syntax (`@plugin 'daisyui';` in `app/assets/css/main.css`, no config file needed). `LoginForm.vue` is the reference for the intended markup — `fieldset`/`label`/`input`/`btn`/`alert` component classes, not raw utilities, for form controls, buttons and alerts.

## Testing

Two layers: `npm test` (Vitest) mocks the composable/service boundary and runs fast — one test per layer of a module. `npm run test:e2e` (Playwright, `e2e/*.spec.ts`) drives an actual browser against an ephemeral Nuxt server, mocking only the network (`page.route()`), so it catches real hydration/accessibility/navigation bugs the component tests can't. A screen or form-flow change isn't verified by `npm test` alone — see [`.claude/rules/architecture.md`](.claude/rules/architecture.md), "Testing", for when to reach for each.

## Why the backend error shape is opinionated

`HttpClient.ts` expects a Laravel-style `{message, errors}` JSON body on non-2xx responses, and Bearer-token auth matching a Sanctum-style `{user, token}` login response — built to pair with [`base_laravel_modular`](../base_laravel_modular)'s `apps/backend`. That backend doesn't have `/auth/login`/`/auth/logout` built yet (no Sanctum installed there as of this writing) — see that repo's roadmap.

## Roadmap

- [x] `login` as a fully-implemented reference module (types, service+error, composable, component, view — all tested).
- [x] `authStore` + `useAuthSubmit`/`useLogout` as the shared session pattern.
- [x] DaisyUI wired and demonstrated in `LoginForm.vue`.
- [x] Playwright e2e suite (`e2e/login.spec.ts`, 6 cases) alongside the Vitest unit/component suite.
- [ ] No generator/skill scaffolding a new module yet — by hand, following `login`'s shape.
- [ ] `register` (the natural second consumer of `useAuthSubmit`) isn't built.
- [ ] No navigation chrome (sidebar/navbar) yet.
- [ ] `apps/backend`'s Sanctum-shaped auth endpoints — needed for this app to talk to a real backend.
