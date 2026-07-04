import { create } from "zustand";

export type DiscoverFilters = {
  search: string;
  age?: number;
  activity?: string;
  startDate?: string;
  endDate?: string;
  maxPrice?: number;
  minRating?: number;
  maxDistanceKm?: number;
  friendsOnly?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
};

type DiscoverStore = {
  filters: DiscoverFilters;
  selectedClubId: string | null;
  setFilters: (filters: Partial<DiscoverFilters>) => void;
  resetFilters: () => void;
  setSelectedClubId: (id: string | null) => void;
};

const defaultFilters: DiscoverFilters = {
  search: "",
  maxDistanceKm: 10,
};

export const useDiscoverStore = create<DiscoverStore>((set) => ({
  filters: defaultFilters,
  selectedClubId: null,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setSelectedClubId: (id) => set({ selectedClubId: id }),
}));
