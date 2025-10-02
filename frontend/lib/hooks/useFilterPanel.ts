"use client";

import { create } from "zustand";

interface FilterPanelState {
  isOpen: boolean;
  focusHandler: (() => void) | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerFocusHandler: (handler: (() => void) | null) => void;
}

export const useFilterPanelStore = create<FilterPanelState>((set, get) => ({
  isOpen: false,
  focusHandler: null,
  open: () => {
    set({ isOpen: true });
    setTimeout(() => {
      get().focusHandler?.();
    }, 50);
  },
  close: () => set({ isOpen: false }),
  toggle: () => {
    set((state) => ({ isOpen: !state.isOpen }));
    setTimeout(() => {
      if (get().isOpen) {
        get().focusHandler?.();
      }
    }, 50);
  },
  registerFocusHandler: (handler) => set({ focusHandler: handler })
}));
