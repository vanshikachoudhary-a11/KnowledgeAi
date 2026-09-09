import { createContext, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);
const SESSION_KEY = 'knowledge-ai-session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const authenticate = ({ name, email }) => {
    const nextUser = { name: name || email.split('@')[0], email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), authenticate, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
