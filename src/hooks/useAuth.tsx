import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getToken, setToken as storeToken, clearToken as removeToken } from "../lib/auth";

interface AuthContextValue {
  token: string | null;
  authenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  authenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());

  const login = useCallback((newToken: string) => {
    storeToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
  }, []);

  return (
    <AuthContext value={{
      token,
      authenticated: token !== null,
      login,
      logout,
    }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
