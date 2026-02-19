// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode"; // ✅ fixed import: no need for .default

import authService from "../../modules/auth/services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  /** Decode JWT token from localStorage */
  const decodeToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token); // ✅ correct usage
      return {
        id: decoded.sub,
        role: decoded.role,
        hospitalId: decoded.hospitalId ?? null,
        exp: decoded.exp ?? null, // could be used for token expiry checks
      };
    } catch (err) {
      console.error("Failed to decode token:", err);
      return null;
    }
  }, []);

  /** Logout user */
  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("hospitalId");
    setUser(null);
    setError(null);
  }, []);

  /** Initialize auth on app mount */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setInitialized(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const decoded = decodeToken();

        if (!decoded) throw new Error("Invalid token");

        // Optional: check token expiry
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
          console.warn("Token expired");
          logout();
          return;
        }

        // Fetch full user info from API
        const fullUser = await authService.getCurrentUser();
        const mergedUser = { ...decoded, ...fullUser };

        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        if (mergedUser.hospitalId) localStorage.setItem("hospitalId", mergedUser.hospitalId);
      } catch (err) {
        console.error("Auth initialization failed:", err);
        logout();
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    initAuth();
  }, [decodeToken, logout]);

  /** Login user */
  const login = useCallback(
    async (email, password, hospitalId = null) => {
      setLoading(true);
      setError(null);

      try {
        const { token, user: apiUser } = await authService.login(email, password, hospitalId);

        localStorage.setItem("token", token);

        const decoded = decodeToken();
        if (!decoded) throw new Error("Failed to decode token after login");

        const mergedUser = { ...decoded, ...apiUser };

        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        if (mergedUser.hospitalId) localStorage.setItem("hospitalId", mergedUser.hospitalId);

        return { success: true, user: mergedUser };
      } catch (err) {
        console.error("Login failed:", err);
        const message = err.message || "Login failed";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [decodeToken]
  );

  /** Update user manually */
  const updateUser = useCallback(
    (userData) => {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    },
    []
  );

  /** Role & auth checks */
  const hasRole = useCallback((role) => user?.role === role, [user]);
  const hasAnyRole = useCallback((roles) => roles.includes(user?.role), [user]);
  const isAuthenticated = useCallback(() => !!user, [user]);

  /** Memoized context value to avoid unnecessary re-renders */
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      initialized,
      error,
      login,
      logout,
      updateUser,
      hasRole,
      hasAnyRole,
      isAuthenticated,
    }),
    [user, loading, initialized, error, login, logout, updateUser, hasRole, hasAnyRole, isAuthenticated]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
