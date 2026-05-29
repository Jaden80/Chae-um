import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { School, SchoolClass, Teacher, SchoolSnapshot } from '@/types';

interface SchoolState {
  searchResults:   School[];
  searchKeyword:   string;
  isSearching:     boolean;
  searchError:     string | null;
  selectedSchool:  School | null;
  classes:         SchoolClass[];
  isLoadingClasses: boolean;
  principal:       Teacher | null;
  vPrincipal:      Teacher | null;
  admin:           Teacher | null;
  teachers:        Teacher[];
  staffLoadedAt:   string | null;
  snapshot:        SchoolSnapshot | null;

  setSearchResults:  (results: School[], keyword: string) => void;
  setSearching:      (isSearching: boolean) => void;
  setSearchError:    (error: string | null) => void;
  selectSchool:      (school: School) => void;
  setClasses:        (classes: SchoolClass[]) => void;
  setLoadingClasses: (isLoading: boolean) => void;
  setStaffFromExcel: (staff: {
    principal?:  Teacher;
    vPrincipal?: Teacher;
    admin?:      Teacher;
    teachers:    Teacher[];
  }) => void;
  setStaffManual: (staff: {
    principal?:  Teacher;
    vPrincipal?: Teacher;
    admin?:      Teacher;
    teachers:    Teacher[];
  }) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  removeTeacher: (id: string) => void;
  buildSnapshot: () => SchoolSnapshot | null;
  resetSearch:   () => void;
  resetAll:      () => void;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set, get) => ({
      searchResults: [], searchKeyword: '', isSearching: false,
      searchError: null, selectedSchool: null, classes: [],
      isLoadingClasses: false, principal: null, vPrincipal: null,
      admin: null, teachers: [], staffLoadedAt: null, snapshot: null,

      setSearchResults: (results, keyword) =>
        set({ searchResults: results, searchKeyword: keyword, searchError: null, isSearching: false }),
      setSearching:      (isSearching)  => set({ isSearching }),
      setSearchError:    (searchError)  => set({ searchError, isSearching: false }),
      selectSchool:      (school)       => set({ selectedSchool: school,
        searchResults: [], classes: [], snapshot: null }),
      setClasses:        (classes)      => set({ classes, isLoadingClasses: false }),
      setLoadingClasses: (isLoadingClasses) => set({ isLoadingClasses }),

      setStaffFromExcel: ({ principal, vPrincipal, admin, teachers }) =>
        set({ principal: principal ?? null, vPrincipal: vPrincipal ?? null,
              admin: admin ?? null, teachers,
              staffLoadedAt: new Date().toISOString(), snapshot: null }),

      setStaffManual: ({ principal, vPrincipal, admin, teachers }) =>
        set({ principal: principal ?? null, vPrincipal: vPrincipal ?? null,
              admin: admin ?? null, teachers,
              staffLoadedAt: new Date().toISOString(), snapshot: null }),

      updateTeacher: (id, updates) =>
        set((state) => ({
          teachers: state.teachers.map((t) => t.id === id ? { ...t, ...updates } : t),
        })),

      removeTeacher: (id) =>
        set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),

      buildSnapshot: () => {
        const state = get();
        if (!state.selectedSchool) return null;
        const snapshot: SchoolSnapshot = {
          school:     state.selectedSchool,
          classes:    state.classes,
          principal:  state.principal  ?? undefined,
          vPrincipal: state.vPrincipal ?? undefined,
          admin:      state.admin      ?? undefined,
          teachers:   state.teachers,
          loadedAt:   new Date().toISOString(),
        };
        set({ snapshot });
        return snapshot;
      },

      resetSearch: () => set({ searchResults: [], searchKeyword: '', searchError: null }),
      resetAll:    () => set({ searchResults: [], searchKeyword: '', searchError: null,
        selectedSchool: null, classes: [], isLoadingClasses: false, snapshot: null,
        principal: null, vPrincipal: null, admin: null, teachers: [], staffLoadedAt: null }),
    }),
    {
      name:    'trip-doc-school',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedSchool: state.selectedSchool,
        classes:        state.classes,
        principal:      state.principal,
        vPrincipal:     state.vPrincipal,
        admin:          state.admin,
        teachers:       state.teachers,
        staffLoadedAt:  state.staffLoadedAt,
      }),
    }
  )
);
