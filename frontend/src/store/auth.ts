import { create } from "zustand";
import type { UserPublic } from "../types";

const REFRESH_KEY = "nexus.refresh";

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: UserPublic, access: string, refresh: string) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserPublic) => void;
  clear: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: typeof window !== "undefined" ? sessionStorage.getItem(REFRESH_KEY) : null,
  setSession: (user, access, refresh) => {
    sessionStorage.setItem(REFRESH_KEY, refresh);
    set({ user, accessToken: access, refreshToken: refresh });
  },
  setTokens: (access, refresh) => {
    sessionStorage.setItem(REFRESH_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    sessionStorage.removeItem(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
  hydrate: () => {
    const refresh = sessionStorage.getItem(REFRESH_KEY);
    set({ refreshToken: refresh });
  },
}));
