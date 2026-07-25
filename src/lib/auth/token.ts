// =============================================================================
// Auth Token Store — shared between session.tsx and tRPC client
// =============================================================================
// Module-level variable ensures the token is immediately available to the
// tRPC headers() function without any async/timing issues.
// =============================================================================

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  // Also persist to sessionStorage for page refresh
  if (token) {
    try { sessionStorage.setItem("skills-hub-token", token); } catch {}
  } else {
    try { sessionStorage.removeItem("skills-hub-token"); } catch {}
  }
}

export function getAuthToken(): string | null {
  // Read from module-level variable first, then fall back to sessionStorage
  if (authToken) return authToken;
  try {
    const stored = sessionStorage.getItem("skills-hub-token");
    if (stored) {
      authToken = stored;
      return stored;
    }
  } catch {}
  return null;
}
