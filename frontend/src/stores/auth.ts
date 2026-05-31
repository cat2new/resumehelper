import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSessionToken } from '@/api/client';

interface User {
  user_id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginUser: (user: User, token: string) => void;
  logoutUser: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loginUser: (user, token) => {
        setSessionToken(token);
        set({ user, isAuthenticated: true });
      },
      logoutUser: () => {
        setSessionToken(null);
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (data) =>
        set((s) => ({ user: s.user ? { ...s.user, ...data } : s.user })),
    }),
    {
      name: 'resumehelper-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
