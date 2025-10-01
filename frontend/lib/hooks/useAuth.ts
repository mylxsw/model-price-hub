"use client";

import { create } from "zustand";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  login: (token) => {
    localStorage.setItem("mph_token", token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("mph_token");
    set({ token: null, isAuthenticated: false });
  }
}));

export function initializeAuthFromStorage() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("mph_token");
  if (token) {
    useAuthStore.getState().login(token);
  }
}
