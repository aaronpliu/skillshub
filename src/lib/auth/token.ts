// =============================================================================
// Auth Token Store — shared between session.tsx and tRPC client
// =============================================================================
// Module-level variable ensures the token is immediately available to the
// tRPC headers() function without any async/timing issues.
// Uses localStorage for persistence across tabs and browser restarts.
// =============================================================================

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    try { localStorage.setItem("skills-hub-token", token); } catch {}
  } else {
    try { localStorage.removeItem("skills-hub-token"); } catch {}
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  try {
    const stored = localStorage.getItem("skills-hub-token");
    if (stored) {
      authToken = stored;
      return stored;
    }
  } catch {}
  return null;
}
