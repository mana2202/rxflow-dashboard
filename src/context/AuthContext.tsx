import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { demoUsers } from '@/data/demo';

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>(
    () => (localStorage.getItem('rxflow_role') as UserRole) ?? 'sales_rep'
  );

  const currentUser = demoUsers.find(u => u.role === currentRole) ?? demoUsers[0];

  const login = () => { setIsLoggedIn(true); localStorage.setItem('rxflow_auth', '1'); };
  const logout = () => { setIsLoggedIn(false); localStorage.removeItem('rxflow_auth'); localStorage.removeItem('rxflow_role'); };
  const setRole = (r: UserRole) => { setCurrentRole(r); localStorage.setItem('rxflow_role', r); };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      currentUser,
      currentRole,
      setRole,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
