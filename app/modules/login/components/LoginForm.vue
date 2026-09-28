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
    <h1 class="mb-1 text-center text-2xl font-semibold">
      {{ locale.welcomeBack }}
    </h1>
    <p class="mb-6 text-center text-sm text-base-content/60">
      {{ locale.welcomeSubtitle }}
    </p>

    <form class="flex flex-col gap-2" novalidate @submit.prevent="onSubmit">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ locale.emailLabel }}</legend>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="username"
          :placeholder="locale.emailPlaceholder"
          :aria-label="locale.emailLabel"
          :aria-invalid="!!emailError"
          :aria-describedby="emailError ? 'email-error' : undefined"
          class="input w-full"
          :class="{ 'input-error': emailError }"
          @blur="touched.email = true"
        />
        <p v-if="emailError" id="email-error" role="alert" class="label text-error">
          {{ emailError }}
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ locale.passwordLabel }}</legend>
        <label class="input w-full" :class="{ 'input-error': passwordError }">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            :aria-label="locale.passwordLabel"
            :aria-invalid="!!passwordError"
            :aria-describedby="passwordError ? 'password-error' : undefined"
            class="grow"
            @blur="touched.password = true"
          />
          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm"
            :aria-label="showPassword ? locale.hidePassword : locale.showPassword"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" :stroke-width="1.75" />
            <Eye v-else :size="18" :stroke-width="1.75" />
          </button>
        </label>
        <p v-if="passwordError" id="password-error" role="alert" class="label text-error">
          {{ passwordError }}
        </p>
      </fieldset>

      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft mt-2 text-sm">
        {{ errorMessage }}
      </div>

      <button type="submit" class="btn btn-primary mt-4 w-full" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
        {{ isSubmitting ? locale.submitting : locale.submit }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-base-content/60">
      {{ locale.signupPrompt }}
      <NuxtLink to="/register" class="link link-primary font-medium">
        {{ locale.signupCta }}
      </NuxtLink>
    </p>
  </div>
</template>
