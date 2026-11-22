import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { authService, RegisterInput, User } from "@/services/auth.service";
import { UNAUTHORIZED_EVENT } from "@/lib/http";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start from the cached profile so pages render at once, then ask the server.
  const [user, setUserState] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setUserState(await authService.fetchCurrentUser());
  }, []);

  useEffect(() => {
    if (authService.getCurrentUser()) void refreshUser();
    const onUnauthorized = () => {
      authService.clearCurrentUser();
      setUserState(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [refreshUser]);

  const run = async (action: () => Promise<{ user: User }>, fallback: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await action();
      setUserState(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login: (email, password) => run(() => authService.login(email, password), "Login failed"),
    register: (userData) => run(() => authService.register(userData), "Registration failed"),
    logout: () => {
      authService.logout();
      setUserState(null);
      setError(null);
    },
    refreshUser,
    setUser: (next) => {
      authService.setCurrentUser(next);
      setUserState(next);
    },
    clearError: () => setError(null),
    isAdmin: user?.role === "admin",
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
