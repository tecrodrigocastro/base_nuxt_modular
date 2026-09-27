import type { RouteRecordRaw } from 'vue-router'

const LoginView = () => import('../views/LoginView.vue')

// Documental registration of the module's route. Nuxt's file-based routing
// (app/pages/login.vue) is what actually resolves navigation today — this
// file exists so the module is self-describing and ready for a project
// that later needs its own SPA-style router shell.
export const loginRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
]

export default loginRoutes
