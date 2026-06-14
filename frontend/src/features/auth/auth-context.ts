import { createContext } from 'react';
import type { AuthUser, LoginRequest } from './types';

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginUser: (request: LoginRequest) => Promise<AuthUser>;
  logoutUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
