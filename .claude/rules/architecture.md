# Architecture

The full module pattern (layer boundaries, the mandatory-registration checklist, the data-flow diagram) lives in [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — read that first. This file covers what's specific to using it as a template.

## `login` is the reference module

`app/modules/login/` is a complete, working example of every layer in `docs/ARCHITECTURE.md` (types, service + error class, composable, component, view, router registration, locale, tests for every layer). Imitate its shape when creating a new module — the same way `packages/withdrawals` is the reference module in `base_laravel_modular`, and `auth` is the reference feature in `base_clean_arch_bloc`.

## Why this app talks to a Laravel-shaped backend

`HttpClient`'s error handling (`{message, errors}` on non-2xx, `Bearer` token auth) is not generic REST — it's shaped to match `base_laravel_modular`'s `apps/backend` API responses exactly (Laravel's default validation-error and auth-error JSON shape). If this template ends up talking to a different kind of backend, `HttpClient.ts` is the one file to adapt; every module's own `{Name}Error` class stays the same, since it only depends on `HttpClientError`'s shape (`message`, `statusCode`, `fieldErrors`), not on `HttpClient`'s internals.

`authStore`'s session payload (`{ user: { id, name, email, avatar_url, created_at }, token }`) matches what Laravel Sanctum's typical "issue a personal access token on login" pattern returns. `apps/backend` in `base_laravel_modular` doesn't have this endpoint built yet (no Sanctum installed as of this template's writing) — building `POST /auth/login` and `POST /auth/logout` there, returning this exact shape, is what makes this frontend's `login` module actually work end-to-end instead of just being a shape.

## Two different reasons a piece of code is "shared"

Mirrors `base_laravel_modular`'s own distinction (see that repo's `architecture.md`, "Two different reasons a Model must live in `packages/*`") — worth keeping the same discipline here:

- **`app/application/shared/`** is for code more than one module needs, that isn't itself global *state* — `useLogout` (a cross-cutting action, not owned by any one module), `useAuthSubmit` (a flow shared by `login` and any future `register`), `authService` (a backend call not owned by one module). These are composables/services, not stores.
- **`app/stores/`** (Pinia) is only for state that's genuinely global — read or written from unrelated parts of the app, not scoped to one screen. `authStore` is the only one in this template; adding a second one should meet the same bar (ask: "does more than one unrelated module need to read this reactively?", not "is this convenient to put somewhere central").

Don't reach for a Pinia store because a piece of state is shared between two files inside the *same* module — that's what the module's own composable is for.

## UI kit: DaisyUI

[DaisyUI](https://daisyui.com/) is wired via Tailwind v4's CSS-first plugin syntax — `@plugin 'daisyui';` in `app/assets/css/main.css`, no `tailwind.config.js`/`daisyui.config.js` needed. `LoginForm.vue` is the reference for the intended markup: `fieldset` + `fieldset-legend` + `label` (not raw utility classes) for form fields, `input`/`input-error` for text inputs (a `<label class="input">` wraps input + inline icon/button when one is needed, e.g. the password visibility toggle), `btn`/`btn-primary`/`btn-ghost` for buttons, `alert`/`alert-error` for inline error messages. Reach for a DaisyUI component class before reaching for raw Tailwind utilities on anything that's a form control, button, or alert — that's the entire point of installing it. Utilities are still fine for layout (`flex`, `gap-*`, `max-w-sm`) and one-off spacing/typography DaisyUI doesn't have an opinion on.

**Gotcha: `fieldset-legend` is not a label.** A `<legend>` names the `<fieldset>` group for assistive tech, it does not create a programmatic label association with the one input inside it — `getByLabel('Senha')`/screen readers navigating by form field won't find the input through the legend alone. Every input still needs its own `aria-label` (or a real `<label for>`) matching the legend text, even though that looks redundant next to the visible legend — see `LoginForm.vue`'s `email`/`password` inputs.

## Testing

Two layers, two different jobs — a UI change isn't done until both are green, not just one:

- **`npm test`** (Vitest) — one test per layer of a module (`vitest` with `@nuxt/test-utils`'s `mountSuspended` for anything needing the Nuxt runtime — composables using `useRuntimeConfig`, components; plain `vitest` for framework-free units — services, error classes). Fast, mocks the composable/service boundary, doesn't touch a real DOM or browser. `test/setup.ts` stubs `localStorage` globally so `authStore`'s hydrate/persist logic is testable without a real browser. A new module should ship with the same per-layer coverage `login` has, not a single end-to-end test standing in for it.
- **`npm run test:e2e`** (Playwright, `e2e/*.spec.ts`) — exercises the actual rendered app in a real browser: hydration, focus/blur behavior, real form submission, real navigation after success. This is what the Vitest component tests *can't* catch, since those mock `useLogin()` entirely. `e2e/login.spec.ts` is the reference: it mocks only the network boundary (`page.route('**/api/v1/auth/login', ...)`), not the composable, so the whole client-side stack (validation → composable → store → redirect) runs for real. No separate `npm run dev` needed first — `@nuxt/test-utils/playwright`'s `goto` fixture (imported via `test`/`expect` from `@nuxt/test-utils/playwright`, not `@playwright/test` directly) builds and boots an ephemeral Nuxt server per run.

**When Claude (or anyone) changes a screen or a form flow, verify it by running `npm run test:e2e`, not just `npm test`.** A component test mocking `useLogin()` will happily go green on a change that breaks real hydration, a real `aria-label`, or the real redirect — only the Playwright suite drives the actual browser and would catch that. Add or extend an `e2e/*.spec.ts` case for the flow being changed before considering the change verified, the same way `login`'s six cases (render, empty-submit validation, invalid-email validation, password-visibility toggle, 401 error, success+redirect) cover its whole user-facing behavior, not just its internals. Vitest and Playwright both use the `.spec.ts`/`.test.ts` suffix — `vitest.config.ts` excludes `e2e/` so the two runners don't collide; keep new Playwright specs inside `e2e/` and new Vitest specs colocated with their module, never the other way around.
