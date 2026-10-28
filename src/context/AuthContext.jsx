// src/context/AuthContext.jsx

import { createContext, useContext, useState } from 'react';
import {
  login  as apiLogin,
  logout as apiLogout,
  getStoredUser,
} from '../controllers/authController';

const AuthContext = createContext(null);

// Finds the storage entry that holds the logged-in user and overwrites it,
// so the updated name survives a page refresh.
function persistUser(oldUser, newUser) {
  [localStorage, sessionStorage].forEach((store) => {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      try {
        const parsed = JSON.parse(store.getItem(key));
        if (
          parsed &&
          typeof parsed === 'object' &&
          ((parsed.email && parsed.email === oldUser.email) ||
            (parsed.id && parsed.id === oldUser.id) ||
            (parsed._id && parsed._id === oldUser._id))
        ) {
          store.setItem(key, JSON.stringify({ ...parsed, ...newUser }));
        }
      } catch {
        // not JSON (e.g. token string) → ignore
      }
    }
  });
}

export function AuthProvider({ children }) {
  // Hydrate from localStorage on first render
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    console.debug('[AuthContext] initial user from storage:', stored);
    return stored;
  });

  const login = async (email, password) => {
    console.debug('[AuthContext] login() → delegating to authController');
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
    console.debug('[AuthContext] login() → user state updated:', loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    console.debug('[AuthContext] logout() → delegating to authController');
    apiLogout();
    setUser(null);
  };

  // Update user fields (e.g. name) in state + storage
  const updateUser = (changes) => {
    if (!user) return;
    const next = { ...user, ...changes };
    console.debug('[AuthContext] updateUser() →', changes);
    persistUser(user, next);
    setUser(next);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}