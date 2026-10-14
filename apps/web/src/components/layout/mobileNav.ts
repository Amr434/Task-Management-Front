"use client";

import { create } from 'zustand';

// On phones the sidebar is a slide-in menu. It remembers the page it was
// opened on, so it closes by itself as soon as you go to another page.
interface MobileNavState {
  openOn: string | null;
  open: (path: string) => void;
  close: () => void;
}

export const useMobileNav = create<MobileNavState>((set) => ({
  openOn: null,
  open: (path) => set({ openOn: path }),
  close: () => set({ openOn: null }),
}));
