import { useAuthStore } from '@/stores/authStore'

export default defineNuxtPlugin(() => {
  useAuthStore().hydrate()
})
