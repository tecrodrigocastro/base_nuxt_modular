<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/application/shared/composables/useLogout'

const authStore = useAuthStore()
const { logout } = useLogout()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 class="text-2xl font-semibold">base_nuxt_modular</h1>
    <p v-if="authStore.isAuthenticated" class="text-sm text-base-content/70">
      Signed in as {{ authStore.user?.name }} ({{ authStore.user?.email }})
    </p>
    <p v-else class="text-sm text-base-content/70">
      Not signed in.
      <NuxtLink to="/login" class="link link-primary font-medium">Log in</NuxtLink>
    </p>
    <button
      v-if="authStore.isAuthenticated"
      type="button"
      class="btn btn-outline btn-sm"
      @click="logout"
    >
      Log out
    </button>
  </div>
</template>
