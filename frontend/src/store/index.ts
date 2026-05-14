import { create } from 'zustand';

export type UserSessionState = {
  isLoggedIn: boolean;
  expiresAt: number | null;
  checking: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setExpiresAt: (expiresAt: number | null) => void;
  setChecking: (checking: boolean) => void;
};

const userSessionStore = create<UserSessionState>((set) => ({
  isLoggedIn: false,
  expiresAt: null,
  checking: true,
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setExpiresAt: (expiresAt) => set({ expiresAt }),
  setChecking: (checking) => set({ checking }),
}));

export default userSessionStore;
