import { ref } from 'vue'
import { useAuthStore, type AuthenticatedUser } from '@/stores/authStore'

interface AuthUserPayload {
  id: number
  name: string
  email: string
  avatar_url: string | null
  created_at: string
}

interface AuthPayload {
  user: AuthUserPayload
  token: string
}

interface MappedError {
  message: string
  fieldErrors: Record<string, string[]> | null
}

interface UseAuthSubmitOptions<TCredentials> {
  request: (credentials: TCredentials) => Promise<AuthPayload>
  mapError: (error: unknown) => MappedError
}

function translateAuthUser(payload: AuthUserPayload): AuthenticatedUser {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    avatarUrl: payload.avatar_url,
  }
}

/**
 * Shared between login and register (or any other flow hitting an endpoint
 * that returns { user, token }): on success it saves the session in
 * authStore. Error message/field mapping stays with each module, since only
 * it knows its own API's error shape.
 */
export function useAuthSubmit<TCredentials>(options: UseAuthSubmitOptions<TCredentials>) {
  const authStore = useAuthStore()

  const isSubmitting = ref(false)
  const errorMessage = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string[]> | null>(null)

  async function submit(credentials: TCredentials): Promise<boolean> {
    isSubmitting.value = true
    errorMessage.value = null
    fieldErrors.value = null

    try {
      const payload = await options.request(credentials)
      authStore.setSession(translateAuthUser(payload.user), payload.token)
      return true
    } catch (error) {
      const mapped = options.mapError(error)
      errorMessage.value = mapped.message
      fieldErrors.value = mapped.fieldErrors
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, errorMessage, fieldErrors, submit }
}
