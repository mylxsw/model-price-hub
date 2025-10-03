"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type LayoutMode = "centered" | "full";

interface LayoutModeState {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  toggle: () => void;
}

export const useLayoutModeStore = create<LayoutModeState>()(
  persist(
    (set) => ({
      mode: "centered",
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set((state) => ({ mode: state.mode === "centered" ? "full" : "centered" }))
    }),
    {
      name: "layout-mode-preference"
    }
  )
);
