const CLERK_QUERY_PARAMS = [
  '__clerk_handshake',
  '__clerk_handshake_nonce',
  '__clerk_db_jwt',
  '__clerk_redirect_url',
  '__clerk_ticket',
  '__clerk_status',
  '__clerk_api_version',
  '__clerk_hs_reason',
] as const

/** Remove Clerk-internal query params from the URL after auth has finished. */
export function stripClerkQueryParams(): boolean {
  const url = new URL(window.location.href)
  let changed = false

  for (const param of CLERK_QUERY_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param)
      changed = true
    }
  }

  if (!changed) return false

  const next = url.pathname + url.search + url.hash
  window.history.replaceState(window.history.state, '', next)
  return true
}
