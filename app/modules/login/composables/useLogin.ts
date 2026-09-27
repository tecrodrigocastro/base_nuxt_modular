import { useAuthSubmit } from '@/application/shared/composables/useAuthSubmit'
import loginService from '../services/loginService'
import { LoginError } from '../services/loginError'
import locale from '../locales/pt-br'
import type { LoginCredentials } from '../types'

function mapError(error: unknown) {
  if (!(error instanceof LoginError)) {
    return { message: locale.genericError, fieldErrors: null }
  }

  if (error.statusCode === 401) {
    return { message: locale.invalidCredentials, fieldErrors: error.fieldErrors }
  }

  if (error.statusCode === 429) {
    return { message: locale.tooManyAttempts, fieldErrors: error.fieldErrors }
  }

  if (error.statusCode === 422 && error.fieldErrors) {
    return { message: Object.values(error.fieldErrors)[0]?.[0] ?? locale.genericError, fieldErrors: error.fieldErrors }
  }

  return { message: locale.genericError, fieldErrors: error.fieldErrors }
}

export function useLogin() {
  return useAuthSubmit<LoginCredentials>({
    request: (credentials) => loginService.login(credentials),
    mapError,
  })
}
