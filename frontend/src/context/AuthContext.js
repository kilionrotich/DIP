// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useMemo, useState } from 'react';
import { login, register } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  // Start with false so we don’t get stuck on “Loading…”
  const [loading, setLoading] = useState(false);

  const value = useMemo(() => {
    async function doRegister(form) {
      const res = await register(form);
      return res;
    }

    async function doLogin(form) {
      const res = await login(form);

      // Backend returns: { token, user: { id, email, role } }
      const nextToken = res?.token || res?.data?.token || res?.jwt || null;
      const nextUser = res?.user || res?.data?.user || null;

      // Some builds may accidentally return { data: { token, user } }
      // Try to recover token from nested structures.
      const recoveredToken =
        nextToken ||
        res?.data?.token ||
        res?.data?.data?.token ||
        null;

      const recoveredUser =
        nextUser ||
        res?.data?.user ||
        res?.data?.data?.user ||
        null;

      if (!recoveredToken) {
        // include debug payload for easier diagnosing in production
        throw new Error('Login succeeded but token was not returned by backend.');
      }

      localStorage.setItem('token', recoveredToken);
      if (recoveredUser) localStorage.setItem('user', JSON.stringify(recoveredUser));

      setToken(recoveredToken);
      setUser(recoveredUser);
      return res;
    }

    function logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }

    return {
      token,
      user,
      role: user?.role || user?.type,
      loading,
      login: doLogin,
      register: doRegister,
      logout,
      isAuthenticated: Boolean(token),
    };
  }, [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}