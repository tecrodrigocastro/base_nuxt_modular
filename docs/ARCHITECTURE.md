# Module architecture — Nuxt web

> Module organization pattern for the web app. Reference document — for Claude and for the team. Adapted from a real production app's own `docs/ARCHITECTURE.md`; `login` is this template's reference module, imitate its shape when creating a new one.

## Where modules live

Nuxt reserves `<root>/modules/` for Nuxt's own extension modules (build modules). To avoid colliding with that, feature modules live in **`app/modules/<name>/`** (inside Nuxt 4's `srcDir`), not in a root-level `modules/`.

## Module structure

```
app/modules/<name>/
├── components/                    one component per screen block (+ tests)
├── composables/use<Name>.ts       state + payload translation + notifications (+ tests)
├── locales/pt-br/index.ts         single file, no subfolder, no barrel
├── router/index.ts
├── services/<name>Service.ts + <name>Error.ts   (+ tests)
├── types/index.ts                 single file
└── views/<Name>View.vue           one view per module (+ tests)
```

**Embryonic module (exception):** when a module only provides services consumed by other modules and doesn't have its own screen yet, it can have just `services/` + `types/`.

## Mandatory registration

Every module with a view must be registered in:

- `app/pages/<route>.vue` (Nuxt file-based routing — what actually resolves navigation)
- `app/application/locales/pt-br/index.ts`
- any navigation chrome component (sidebar/navbar), once one exists

`app/modules/<name>/router/index.ts` is a documental registration of the module's route — kept in sync with the file-based route, ready for a project that later needs its own SPA-style router shell instead of (or alongside) file-based routing.

## Layers — the separation matters more than anything else

### `types/`
Only `interface` and `type`. No class, method, factory or function.

### `services/`
Only requests to the backend.

- `export default {}` with a literal object — no class, no `AbstractService`.
- `httpClient` imported from `@/infrastructure/http/HttpClient`.
- URLs at the top of the file.
- Errors wrapped into a module-specific `{Name}Error` class (see `loginError.ts`) so a composable can pattern-match on `instanceof` instead of poking at HTTP status codes directly.
- Query/body assembly happens here.
- **Does not translate the response** — returns the raw payload (whatever shape the API returns), the composable translates it.

### `composables/`
- State with `ref` — **not** a store.
- Translates the API's payload shape (e.g. `snake_case`) into the flat domain shape the UI uses (e.g. `camelCase`).
- Owns submit/loading/error state for its screen.

### `components/`
Each component makes its own requests — it doesn't receive a request callback from its parent.

- A form modal saves on its own and emits `saved`.
- A delete modal deletes on its own and emits `removed`.
- The view only reloads the listing in reaction to those events — it doesn't know how to save/delete.

### `views/`
Orchestration only:

- Assembles the module's components.
- Holds which modal/state is open (e.g. `isFormModalOpen`, `editingId`).
- **No service calls** — that's a component/composable responsibility, not the view's.

## Global state

No per-module store. Pinia is only for genuinely global state (`authStore` is the reference example — session data read by unrelated parts of the app) — never for one screen/feature's state, which stays in a local `useX` composable inside that module.

Logic reused across modules that isn't global state, but a generic cross-cutting concern (e.g. `useLogout`, reused by every piece of navigation chrome regardless of which module it lives next to), goes in `app/application/shared/composables/`. A generic backend call reused the same way (e.g. `authService.logout()`, not owned by any single module) goes in `app/application/shared/services/`.

## Data flow, summarized

```
component/view
  → composable (useX)          state (ref) + payload → domain translation + error mapping
      → service (xService)     raw request to the backend, no translation
          → HttpClient
```

## Error handling shape

`HttpClient` throws a single `HttpClientError` (message, statusCode, fieldErrors) for every non-2xx response, matching the shape a Laravel-style backend returns (`{message, errors}`). A module's own `services/{name}Error.ts` wraps that into a module-specific error class in its service layer — see `login`'s `LoginError` — so the composable's `mapError()` can branch on status code (401 → invalid credentials, 422 → validation, 429 → rate limit) using the module's own vocabulary, not `HttpClientError` directly.

---

*base_nuxt_modular — module convention · v1.0*
