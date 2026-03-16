"use client";

import { create } from "zustand";
import { getMe, type AuthResponse, type AuthUser } from "../lib/api/auth";

const authStorageKey = "clashoftypers.auth.token";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isHydrating: boolean;
  setAuth: (auth: AuthResponse) => void;
  hydrateUser: () => Promise<void>;
  logout: () => void;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(authStorageKey);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrating: false,
  setAuth: ({ token, user }) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(authStorageKey, token);
    }

    set({ token, user });
  },
  hydrateUser: async () => {
    const token = getStoredToken();

    if (!token) {
      set({ token: null, user: null, isHydrating: false });
      return;
    }

    set({ isHydrating: true, token });

    try {
      const response = await getMe(token);
      set({ user: response.user, token, isHydrating: false });
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(authStorageKey);
      }
      set({ token: null, user: null, isHydrating: false });
    }
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(authStorageKey);
    }

    set({ token: null, user: null, isHydrating: false });
  }
}));
