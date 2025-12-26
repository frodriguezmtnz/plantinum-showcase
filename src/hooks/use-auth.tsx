'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// For now, we'll simulate a logged-in user.
// In a real app, this would come from your auth provider.
const MOCK_USER = {
  id: '1',
  username: 'trophy-hunter-1',
  email: 'user@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=trophy-hunter-1',
};

type AuthUser = typeof MOCK_USER | null;

interface AuthContextType {
  user: AuthUser;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Set to `null` to simulate a logged-out user, or `MOCK_USER` for a logged-in one.
  const [user, setUser] = useState<AuthUser>(null);

  const login = () => setUser(MOCK_USER);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
