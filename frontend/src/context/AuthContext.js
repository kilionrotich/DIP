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
      const nextToken = res?.token || res?.data?.token || res?.jwt;
      const nextUser = res?.user || res?.data?.user || null;

      if (!nextToken) throw new Error('Login succeeded but token was not returned by backend.');

      localStorage.setItem('token', nextToken);
      if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser));

      setToken(nextToken);
      setUser(nextUser);
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