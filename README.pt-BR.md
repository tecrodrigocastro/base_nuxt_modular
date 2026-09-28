# base_nuxt_modular

[English version](README.md)

Um **template** Nuxt 4 com convenção de módulo por feature (`app/modules/{nome}/`: types → services → composables → components → views), extraído do documento de arquitetura de um app de produção real, em vez de inventado do zero.

Este repositório é feito pra ser clonado/copiado como ponto de partida de um frontend novo, não pra crescer virando um produto em si — mesmo espírito do [`base_clean_arch_bloc`](../base_clean_arch_bloc) (seu equivalente em Flutter) e do [`base_laravel_modular`](../base_laravel_modular), o monorepo Laravel que este frontend é pensado pra acompanhar como `apps/web`.

> **Status:** roda e é testado. `login` é um módulo de referência completo e funcionando (types, service + classe de erro, composable, componente, view, testes de cada camada — unitário e ponta a ponta). 40 testes unitários passam, 6 testes Playwright e2e passam, o typecheck passa, `npm run build` gera um build de produção funcionando.

```bash
npm install
npx playwright install chromium   # uma vez — baixa o navegador que o Playwright dirige
cp .env.example .env
npm run dev
npm test           # vitest — rápido, mocka a fronteira do composable
npm run test:e2e   # playwright — navegador real, mocka só a rede
```

> **Trabalhando com assistentes de IA**: este projeto tem `CLAUDE.md` e `.claude/rules/` pra que o Claude Code (ou qualquer assistente que leia `CLAUDE.md`) já conheça a arquitetura e as convenções de nomenclatura antes de gerar qualquer coisa.

## A ideia

Toda feature é um módulo em `app/modules/{nome}/`, com separação estrita de camadas: `types/` (só interfaces) → `services/` (chamada crua ao backend, sem tradução de resposta) → `composables/` (estado + tradução + mapeamento de erro) → `components/` (cada um faz suas próprias requests) → `views/` (só orquestração, sem chamada de serviço). Regras completas: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

`login` é o módulo de referência — imite a forma dele ao criar um novo. `app/application/shared/` guarda composables/services reaproveitados entre módulos (como `useLogout`) que não são estado global; `app/stores/` (Pinia) é reservado pra estado genuinamente global — `authStore` é o único aqui.

## Estrutura

```
app/
  application/
    locales/pt-br/index.ts        # agrega o locale de cada módulo — um import+chave por módulo
    shared/
      composables/                 # reaproveitado entre módulos, não é de um só (useLogout, useAuthSubmit)
      services/                    # chamada ao backend não pertencente a um módulo (authService)
  infrastructure/
    http/HttpClient.ts             # único lugar que chama fetch() — auth Bearer, erros no formato Laravel
  modules/
    login/                         # módulo de referência
      types/index.ts
      services/{loginService,loginError}.ts
      composables/useLogin.ts
      components/LoginForm.vue
      views/LoginView.vue
      locales/pt-br/index.ts
      router/index.ts              # documental — quem resolve navegação hoje é o file-based routing do Nuxt
  stores/
    authStore.ts                   # a única store global (Pinia) legítima — dados de sessão
  pages/
    login.vue                      # registra o módulo login no router de arquivos do Nuxt
    index.vue
  plugins/
    auth.client.ts                 # hidrata o authStore a partir do localStorage no boot
e2e/
  login.spec.ts                    # Playwright — navegador real, mocka só a fronteira de rede
```

## Regras principais

- O `services/` de um módulo nunca traduz a resposta da API — só o composable faz isso.
- O `views/` de um módulo nunca chama serviço direto.
- Sem store Pinia por módulo — estado global é só pra coisa lida de verdade em partes não relacionadas do app.
- Todo módulo com view é registrado no file-based routing do Nuxt e em `app/application/locales/pt-br/index.ts`.

Justificativa completa: [`.claude/rules/architecture.md`](.claude/rules/architecture.md). Tabela de nomenclatura: [`.claude/rules/naming-conventions.md`](.claude/rules/naming-conventions.md).

## Kit de UI

O [DaisyUI](https://daisyui.com/) está plugado via sintaxe CSS-first do Tailwind v4 (`@plugin 'daisyui';` em `app/assets/css/main.css`, sem arquivo de config). O `LoginForm.vue` é a referência da marcação esperada — classes de componente `fieldset`/`label`/`input`/`btn`/`alert`, não utilitário cru, pra campo de formulário, botão e alerta.

## Testes

Duas camadas: `npm test` (Vitest) mocka a fronteira do composable/service e roda rápido — um teste por camada de um módulo. `npm run test:e2e` (Playwright, `e2e/*.spec.ts`) dirige um navegador real contra um servidor Nuxt efêmero, mockando só a rede (`page.route()`), então pega bug real de hidratação/acessibilidade/navegação que o teste de componente não pega. Uma mudança de tela ou fluxo de formulário não está verificada só com `npm test` — ver [`.claude/rules/architecture.md`](.claude/rules/architecture.md), "Testing", pra saber quando usar cada um.

## Por que o formato de erro do backend é opinativo

O `HttpClient.ts` espera um corpo JSON no formato Laravel (`{message, errors}`) em resposta não-2xx, e autenticação Bearer no formato de login estilo Sanctum (`{user, token}`) — feito pra conversar com o `apps/backend` do [`base_laravel_modular`](../base_laravel_modular). Esse backend ainda não tem `/auth/login`/`/auth/logout` construídos (sem Sanctum instalado até este momento) — ver o roadmap daquele repositório.

## Roadmap

- [x] `login` como módulo de referência totalmente implementado (types, service+erro, composable, componente, view — tudo testado).
- [x] `authStore` + `useAuthSubmit`/`useLogout` como padrão de sessão compartilhado.
- [x] DaisyUI plugado e demonstrado no `LoginForm.vue`.
- [x] Suíte e2e do Playwright (`e2e/login.spec.ts`, 6 casos) junto da suíte unitária/componente do Vitest.
- [ ] Ainda não tem gerador/skill pra scaffoldar um módulo novo — na mão, seguindo a forma do `login`.
- [ ] `register` (o segundo consumidor natural do `useAuthSubmit`) não está construído.
- [ ] Ainda não tem chrome de navegação (sidebar/navbar).
- [ ] Endpoints de auth no formato Sanctum no `apps/backend` — necessários pra este app conversar com um backend de verdade.
