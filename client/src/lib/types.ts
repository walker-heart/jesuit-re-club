export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  user?: User;
}

export interface AuthError {
  message: string;
}
