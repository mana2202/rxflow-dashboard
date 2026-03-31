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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('pharmacy_staff');

  const currentUser = demoUsers.find(u => u.role === currentRole) ?? demoUsers[0];

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      currentUser,
      currentRole,
      setRole: setCurrentRole,
      login: () => setIsLoggedIn(true),
      logout: () => setIsLoggedIn(false),
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
