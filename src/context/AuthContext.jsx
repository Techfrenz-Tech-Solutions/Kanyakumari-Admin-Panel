import { createContext, useContext, useState } from 'react';
import { currentAdmin } from '../data/mockData.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dw_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email) => {
    const sessionUser = { ...currentAdmin, email: email || currentAdmin.email };
    localStorage.setItem('dw_session', JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const logout = () => {
    localStorage.removeItem('dw_session');
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
