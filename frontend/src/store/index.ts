import { create } from 'zustand';

interface AppState {
  user: any | null;
  activeCampaignId: number | null;
  setUser: (user: any) => void;
  setActiveCampaignId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  activeCampaignId: null,
  setUser: (user) => set({ user }),
  setActiveCampaignId: (activeCampaignId) => set({ activeCampaignId }),
}));
