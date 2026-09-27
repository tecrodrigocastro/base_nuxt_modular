<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { useLogin } from '../composables/useLogin'
import locale from '../locales/pt-br'

const emit = defineEmits<{ success: [] }>()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const showPassword = ref(false)

const { isSubmitting, errorMessage, submit } = useLogin()

const emailError = computed(() => {
  if (!touched.email) {
    return null
  }
  if (!form.email.trim()) {
    return locale.emailRequired
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return locale.emailInvalid
  }
  return null
})

const passwordError = computed(() => {
  if (!touched.password) {
    return null
  }
  return form.password ? null : locale.passwordRequired
})

const isValid = computed(
  () =>
    form.email.trim() !== '' &&
    form.password !== '' &&
    !emailError.value &&
    !passwordError.value
)

async function onSubmit() {
  touched.email = true
  touched.password = true

  if (!isValid.value) {
    return
  }

  const success = await submit({ email: form.email, password: form.password })

  if (success) {
    emit('success')
  }
}
</script>

<template>
  <div class="w-full max-w-sm">
    <h1 class="mb-1 text-center text-2xl font-semibold text-gray-900">
      {{ locale.welcomeBack }}
    </h1>
    <p class="mb-6 text-center text-sm text-gray-500">
      {{ locale.welcomeSubtitle }}
    </p>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700" for="email">
          {{ locale.emailLabel }}
        </label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="username"
          :placeholder="locale.emailPlaceholder"
          :aria-invalid="!!emailError"
          :aria-describedby="emailError ? 'email-error' : undefined"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          :class="{ 'border-red-400': emailError }"
          @blur="touched.email = true"
        />
        <p v-if="emailError" id="email-error" role="alert" class="mt-1 text-xs text-red-600">
          {{ emailError }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700" for="password">
          {{ locale.passwordLabel }}
        </label>
        <div class="relative">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            :aria-invalid="!!passwordError"
            :aria-describedby="passwordError ? 'password-error' : undefined"
            class="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            :class="{ 'border-red-400': passwordError }"
            @blur="touched.password = true"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            :aria-label="showPassword ? locale.hidePassword : locale.showPassword"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" :stroke-width="1.75" />
            <Eye v-else :size="18" :stroke-width="1.75" />
          </button>
        </div>
        <p v-if="passwordError" id="password-error" role="alert" class="mt-1 text-xs text-red-600">
          {{ passwordError }}
        </p>
      </div>

      <p v-if="errorMessage" role="alert" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? locale.submitting : locale.submit }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      {{ locale.signupPrompt }}
      <NuxtLink to="/register" class="font-medium text-blue-600 hover:underline">
        {{ locale.signupCta }}
      </NuxtLink>
    </p>
  </div>
</template>
