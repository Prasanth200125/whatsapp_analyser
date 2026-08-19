// ============================================================
// useAuth.js — Authentication State (Custom Hook)
// ============================================================
// Simple localStorage-based auth state.
// No external library needed for our small app.
// ============================================================
import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);  // true while checking token on load

  // On app start: if token exists, verify it's still valid
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Protect against string "undefined" which breaks JSON.parse
    if (token && storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        logout(); // Bad data, log them out
      }
      
      // Verify token is still valid in background
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => logout())   // Token invalid — clear and logout
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
