'use client';

import { create } from 'zustand';

export type PublicBranch = {
  id?: string;
  slug: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
  phone?: string;
  whatsappPhone?: string;
};

export const useBranchStore = create<{ branch: PublicBranch | null; setBranch: (branch: PublicBranch | null) => void }>((set) => ({
  branch: null,
  setBranch: (branch) => set({ branch }),
}));
