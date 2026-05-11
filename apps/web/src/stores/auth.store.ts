'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Farmer {
  id: string;
  phone: string;
  name: string;
  preferredLanguage: string;
}

interface AuthState {
  farmer: Farmer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { farmer: Farmer; accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      farmer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ farmer, accessToken, refreshToken }) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        set({ farmer, accessToken, refreshToken, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        set({ farmer: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        set({ farmer: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'krishimitra-auth',
      partialize: (state) => ({
        farmer: state.farmer,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
