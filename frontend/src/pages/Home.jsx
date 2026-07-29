import React, { useState } from "react";
import PublicLanding from "./PublicLanding";
import FounderWorkspace from "./FounderWorkspace";
import { authService } from "../services/authService";

/**
 * GARUDA ROUTING CONTROLLER
 * -------------------------
 * Manages clean architectural separation between:
 *  - Public Landing Page ("/")
 *  - Founder Workspace (" /founder" or "/dashboard")
 *
 * Auth Integration Status:
 * Uses `authService` stub prepared for future backend authentication module integration.
 * Currently operates in temporary local development mode.
 */

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const handleLogin = () => {
    authService.loginPlaceholder();
    setIsAuthenticated(true);
    navigateTo("/founder");
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigateTo("/");
  };

  // Route separation logic
  if (currentPath === "/founder" || currentPath === "/dashboard") {
    if (!isAuthenticated) {
      return <PublicLanding onLoginClick={handleLogin} />;
    }
    return <FounderWorkspace onLogout={handleLogout} />;
  }

  // Root path "/" or any public path renders ONLY the Public Landing page
  return <PublicLanding onLoginClick={handleLogin} />;
}