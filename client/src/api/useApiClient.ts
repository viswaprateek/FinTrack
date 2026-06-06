import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from './client'

/**
 * Returns the shared axios instance with a request interceptor that attaches
 * the current Clerk session token. Use this inside components/hooks that need
 * to call authenticated backend endpoints.
 */
export function useApiClient() {
  const { getToken } = useAuth()

  useEffect(() => {
    const interceptorId = apiClient.interceptors.request.use(async (config) => {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    return () => {
      apiClient.interceptors.request.eject(interceptorId)
    }
  }, [getToken])

  return apiClient
}
