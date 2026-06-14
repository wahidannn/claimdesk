import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { getMe, login, logout } from './api';
import { AuthContext } from './auth-context';
import type { LoginRequest } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const user = meQuery.data ?? null;

  async function loginUser(request: LoginRequest) {
    const response = await login(request);
    queryClient.setQueryData(['auth', 'me'], response.user);
    return response.user;
  }

  async function logoutUser() {
    try {
      await logout();
    } finally {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: meQuery.isLoading,
        isAuthenticated: Boolean(user),
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
