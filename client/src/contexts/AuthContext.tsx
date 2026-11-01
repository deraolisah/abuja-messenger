import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { LoginInput, PublicUser, RegisterInput } from "@abuja-messenger/contracts";

import { api } from "../lib/api";

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  login: (input: LoginInput) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await api.get<{ user: PublicUser | null }>("/auth/me");
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      refreshSession,
      login: async (input) => {
        const response = await api.post<{ user: PublicUser }>("/auth/login", input);
        setUser(response.data.user);
        return response.data.user;
      },
      register: async (input) => {
        const response = await api.post<{ user: PublicUser }>("/auth/register", input);
        setUser(response.data.user);
        return response.data.user;
      },
      logout: async () => {
        await api.post("/auth/logout");
        setUser(null);
      },
    }),
    [isLoading, refreshSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}