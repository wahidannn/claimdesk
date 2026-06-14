export type Role = 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};
