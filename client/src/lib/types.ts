export interface User {
  uid: string;
  email: string | null;
  username: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}

export interface AuthResponse {
  message?: string;
  user?: User;
}

export interface AuthError {
  message: string;
  code?: string;
}
