import { apiClient } from './client'

/** Shared axios instance; auth is attached once via ClerkAuthSetup. */
export function useApiClient() {
  return apiClient
}
