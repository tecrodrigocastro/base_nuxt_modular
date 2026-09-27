<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/application/shared/composables/useLogout'

const authStore = useAuthStore()
const { logout } = useLogout()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 class="text-2xl font-semibold text-gray-900">base_nuxt_modular</h1>
    <p v-if="authStore.isAuthenticated" class="text-sm text-gray-600">
      Signed in as {{ authStore.user?.name }} ({{ authStore.user?.email }})
    </p>
    <p v-else class="text-sm text-gray-600">
      Not signed in.
      <NuxtLink to="/login" class="font-medium text-blue-600 hover:underline">Log in</NuxtLink>
    </p>
    <button
      v-if="authStore.isAuthenticated"
      type="button"
      class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      @click="logout"
    >
      Log out
    </button>
  </div>
</template>
