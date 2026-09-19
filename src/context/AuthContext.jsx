// src/context/AuthContext.jsx

import { createContext, useContext, useState } from 'react';
import {
  login  as apiLogin,
  logout as apiLogout,
  getStoredUser,
} from '../controllers/authController';

const AuthContext = createContext(null);

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

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}