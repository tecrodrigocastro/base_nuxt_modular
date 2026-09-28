# Naming conventions

`login` is the reference module — see `packages/withdrawals` for every row's counterpart in `base_laravel_modular`.

| Element | Convention | Example (from `app/modules/login/`) |
|---|---|---|
| Module folder | camelCase, matches the feature it's named after | `login`, future: `register`, `myProfile` |
| Type | `interface`, PascalCase, no `I` prefix | `LoginCredentials` |
| Service | `default { verbNoun(...) }`, one file per module, named `{module}Service.ts` | `loginService.ts`, method `login()` |
| Service error | `{Module}Error extends Error`, carries `statusCode`/`fieldErrors` like `HttpClientError` | `LoginError` |
| Composable | `use{Module}` (module-owned) or `use{Verb}` (shared, cross-cutting) | `useLogin`, `useLogout`, `useAuthSubmit` |
| Component | PascalCase, one per screen block | `LoginForm.vue` |
| View | `{Module}View.vue`, one per module | `LoginView.vue` |
| Store (Pinia) | `use{Name}Store`, only for genuinely global state — see `architecture.md` | `useAuthStore` |
| Locale file | `locales/pt-br/index.ts`, single file, default-exports a flat object | `login/locales/pt-br/index.ts` |
| Unit/component test | same name as the file under test, `.test.ts` suffix, colocated | `useLogin.test.ts` next to `useLogin.ts` |
| E2e test | `{flow}.spec.ts`, lives in root-level `e2e/`, never colocated with the module | `e2e/login.spec.ts` |

## Notes

- **Services never translate the response.** A service returns whatever shape the API sends back (including `snake_case` keys); only the composable translates into the domain shape the UI consumes. This is what lets a service's test assert the raw payload without duplicating translation logic in two places.
- **A composable's `mapError()` (or equivalent) speaks the module's own vocabulary** (`invalidCredentials`, `tooManyAttempts`), never raw HTTP status codes leaking into a component or view.
- **Locale keys are per-module**, not global strings reused across unrelated modules — `login`'s `genericError` and a future `register`'s `genericError` are two different keys in two different files, even if the English/Portuguese text happens to match today. Don't extract a "shared strings" file preemptively.
