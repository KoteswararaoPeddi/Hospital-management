import { create } from "zustand"

type DemoModalState = {
  open: boolean
  openModal: () => void
  closeModal: () => void
}

/** Controls the "Book demo" modal, opened from the nav, hero, pricing, and CTA. */
export const useDemoModal = create<DemoModalState>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}))
