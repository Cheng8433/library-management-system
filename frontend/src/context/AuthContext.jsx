import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    if (!user || typeof user !== 'object' || !user.id) {
      console.warn('Invalid user data in localStorage:', user);
      return null;
    }
    return user;
  } catch (e) {
    console.warn('Failed to parse user from localStorage:', e);
    return null;
  }
}

function base64UrlDecode(str) {
    // 将 Base64Url 转为标准 Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // 补齐 padding
    while (base64.length % 4) base64 += '=';
    return atob(base64);
}

function isTokenValid(token) {
    if (!token) return false;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);
  const [loading, setLoading] = useState(false);

    // ✅ 在这里添加 token 有效性验证
    useEffect(() => {
        const storedToken = getToken();
        if (storedToken && !isTokenValid(storedToken)) {
            // token 无效，清除
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
    }, []); // 空依赖数组，只在挂载时执行一次

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const apiRequest = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, [token]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    apiRequest,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
