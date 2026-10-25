'use client';

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  navigationPrefs: {
    avoidStairs: boolean;
    wheelchairAccessible: boolean;
    avoidRestricted: boolean;
    walkingSpeedKmh: number;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updatePrefs: (prefs: Partial<User['navigationPrefs']>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  setUser: (user) =>
    set({
      user,
      isLoading: false,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
    }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false }),
  updatePrefs: (prefs) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, navigationPrefs: { ...state.user.navigationPrefs, ...prefs } }
        : null,
    })),
}));