/**
 * GARUDA AUTHENTICATION SERVICE (STUB FOR FUTURE BACKEND AUTH MODULE)
 * -------------------------------------------------------------------
 * This module is prepared as a clean interface hook for future backend authentication.
 * 
 * CURRENT STATUS:
 * No backend authentication module (JWT, OAuth, Session Cookie) is implemented yet.
 * The current mechanism is an explicit TEMPORARY DEVELOPMENT PLACEHOLDER for UI routing separation.
 */

export const authService = {
  /**
   * Check if a valid session exists.
   * Future implementation: Validate JWT / Session Token via backend API (/api/auth/session).
   */
  isAuthenticated() {
    return localStorage.getItem("garuda_founder_session") === "active";
  },

  /**
   * Development placeholder login method.
   * Future implementation: POST credentials to /api/auth/login and store verified session token.
   */
  loginPlaceholder() {
    localStorage.setItem("garuda_founder_session", "active");
  },

  /**
   * Clear local session state.
   * Future implementation: POST to /api/auth/logout to invalidate backend session cookie/token.
   */
  logout() {
    localStorage.removeItem("garuda_founder_session");
  }
};
