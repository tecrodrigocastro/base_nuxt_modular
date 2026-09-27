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

## Testing

Every layer in the reference module has a matching test — `vitest` with `@nuxt/test-utils`'s `mountSuspended` for anything that needs the Nuxt runtime (composables using `useRuntimeConfig`, components), plain `vitest` for framework-free units (services, error classes). `test/setup.ts` stubs `localStorage` globally so `authStore`'s hydrate/persist logic is testable without a real browser. Run the whole suite with `npm test`; a new module should ship with the same per-layer coverage `login` has, not a single end-to-end test standing in for it.
