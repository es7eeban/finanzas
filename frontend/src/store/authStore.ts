import { create } from 'zustand';
import { api } from '../services/api';
import type { Currency } from '../types';

export interface User {
  id: string;
  email: string;
  fullName: string;
  baseCurrency: Currency;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, baseCurrency?: Currency) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (fullName, email, password, baseCurrency = 'CLP') => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', {
        fullName,
        email,
        password,
        baseCurrency,
      });
      localStorage.setItem('access_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, token: null });
    }
  },
}));
