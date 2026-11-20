import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    localStorage.removeItem('storycraft-token');
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('storycraft:unauthorized', handleUnauthorized);
    const token = localStorage.getItem('storycraft-token');
    if (!token) {
      setLoading(false);
    } else {
      authApi.me()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => {
          localStorage.removeItem('storycraft-token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
    return () => window.removeEventListener('storycraft:unauthorized', handleUnauthorized);
  }, []);

  const signIn = useCallback((data) => {
    localStorage.setItem('storycraft-token', data.token);
    setUser(data.user);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
