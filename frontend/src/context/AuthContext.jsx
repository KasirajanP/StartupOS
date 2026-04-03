import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../lib/api";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!getAccessToken() || !getRefreshToken()) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const { data } = await api.get("/accounts/me/");
        startTransition(() => {
          setUser(data);
        });
      } catch (error) {
        clearTokens();
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  async function login(credentials) {
    const { data } = await api.post("/accounts/login/", credentials);
    setTokens({ access: data.access, refresh: data.refresh });
    startTransition(() => {
      setUser(data.user);
    });
    return data.user;
  }

  async function registerOrganization(payload) {
    try {
      const { data } = await api.post("/accounts/signup/", payload);
      return data;
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        Object.values(error?.response?.data || {}).flat().join(" ") ||
        error?.message ||
        "Unable to register the organization right now.";
      throw new Error(message);
    }
  }

  async function logout() {
    const refresh = getRefreshToken();

    try {
      if (refresh) {
        await api.post("/accounts/logout/", { refresh });
      }
    } finally {
      clearTokens();
      setUser(null);
    }
  }

  const value = {
    isAuthenticated: Boolean(user),
    isBootstrapping,
    user,
    login,
    registerOrganization,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
