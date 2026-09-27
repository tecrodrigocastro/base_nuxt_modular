<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue'

const route = useRoute()

// Only accept a same-origin, absolute internal path — anything else (a
// full URL, a protocol-relative "//evil.com", a backslash/whitespace trick
// browsers still resolve as external) falls back to the default landing
// page instead of becoming an open redirect.
function safeRedirect(value: unknown): string {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\s]/.test(value)) {
    return value
  }
  return '/'
}

function onSuccess() {
  navigateTo(safeRedirect(route.query.redirect))
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center p-6">
    <LoginForm @success="onSuccess" />
  </div>
</template>
