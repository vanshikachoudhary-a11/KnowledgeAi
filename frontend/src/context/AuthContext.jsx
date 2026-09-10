import { createContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);
const SESSION_KEY = 'knowledge-ai-session';
const TOKEN_KEY = 'knowledge-ai-token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await authService.me();
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        setUser(data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const authenticate = ({ user: nextUser, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), isLoading, authenticate, logout }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
