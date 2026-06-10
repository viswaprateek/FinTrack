import type { AxiosInstance } from 'axios'
import { apiClient } from './client'

type GetToken = () => Promise<string | null>

let registered = false
let getTokenFn: GetToken = async () => null

/** Keep Clerk's getToken fresh without re-registering interceptors. */
export function setAuthGetToken(getToken: GetToken) {
  getTokenFn = getToken
}

/** Attach Clerk auth once — avoids stacking interceptors from every useApiClient() call. */
export function ensureAuthInterceptor(client: AxiosInstance = apiClient) {
  if (registered) return
  registered = true

  client.interceptors.request.use(async (config) => {
    const token = await getTokenFn()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}

// Register at module load so the first React Query fetch has auth available.
ensureAuthInterceptor(apiClient)

export function resetAuthInterceptorForTests() {
  registered = false
  getTokenFn = async () => null
}

export { apiClient }
