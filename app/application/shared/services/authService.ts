import { httpClient } from '@/infrastructure/http/HttpClient'

const LOGOUT_URL = '/auth/logout'

export default {
  async logout(): Promise<void> {
    await httpClient.post(LOGOUT_URL)
  },
}
