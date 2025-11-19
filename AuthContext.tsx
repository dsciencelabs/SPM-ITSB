import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from './types';

interface AuthContextType {
  currentUser: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

// Mock Users for Demo
const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.SUPER_ADMIN]: { id: 'sa-1', name: 'Super Administrator', role: UserRole.SUPER_ADMIN },
  [UserRole.ADMIN]: { id: 'ad-1', name: 'Admin Operasional', role: UserRole.ADMIN },
  [UserRole.AUDITOR]: { id: 'au-1', name: 'Dr. Budi (Auditor)', role: UserRole.AUDITOR },
  [UserRole.AUDITEE]: { id: 'd-1', name: 'Kaprodi Informatika (Auditee)', role: UserRole.AUDITEE, department: 'S1 Teknik Informatika' }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    setCurrentUser(MOCK_USERS[role]);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};