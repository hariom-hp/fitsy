// ─── Token Store ─────────────────────────────────────────────────────────────
// Supports token fallback in memory/sessionStorage alongside httpOnly cookies.
// ─────────────────────────────────────────────────────────────────────────────

let memoryToken = null;

export function getToken() {
  if (memoryToken) return memoryToken;
  try {
    return sessionStorage.getItem('fitsy_token');
  } catch {
    return null;
  }
}

export function setToken(token) {
  memoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem('fitsy_token', token);
    } else {
      sessionStorage.removeItem('fitsy_token');
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    sessionStorage.removeItem('fitsy_token');
  } catch {
    // Ignore storage errors
  }
}
