import { create } from 'zustand';
import type { StudentRow } from '@/types';

// ⚠️ persist 미사용 — 학생 개인정보는 브라우저 메모리(RAM)에만 존재

interface StudentSummary {
  total:            number;
  participating:    number;
  nonParticipating: number;
  specialNeeds:     number;
  subsidyNeeded:    number;
  byGradeClass:     Record<string, number>;
}

interface StudentState {
  students:         StudentRow[];
  isLoaded:         boolean;
  loadedAt:         string | null;
  fileName:         string | null;
  validationErrors: string[];
  summary:          StudentSummary | null;

  loadStudents:           (students: StudentRow[], fileName: string, errors: string[]) => void;
  updateStudent:          (index: number, updates: Partial<StudentRow>) => void;
  toggleParticipation:    (index: number) => void;
  clearStudents:          () => void;
  buildSummary:           () => StudentSummary;
  getParticipatingStudents: () => StudentRow[];
  getStudentsByGradeClass:  (grade: string, className: string) => StudentRow[];
}

const calcSummary = (students: StudentRow[]): StudentSummary => {
  const byGradeClass: Record<string, number> = {};
  students.forEach((s) => {
    const key = `${s.grade}-${s.className}`;
    byGradeClass[key] = (byGradeClass[key] ?? 0) + 1;
  });
  return {
    total:            students.length,
    participating:    students.filter((s) => s.isParticipating).length,
    nonParticipating: students.filter((s) => !s.isParticipating).length,
    specialNeeds:     students.filter((s) => s.hasSpecialNeeds).length,
    subsidyNeeded:    students.filter((s) => s.needsSubsidy).length,
    byGradeClass,
  };
};

export const useStudentStore = create<StudentState>()((set, get) => ({
  students: [], isLoaded: false, loadedAt: null,
  fileName: null, validationErrors: [], summary: null,

  loadStudents: (students, fileName, errors) => {
    const summary = calcSummary(students);
    set({ students, isLoaded: true, loadedAt: new Date().toISOString(),
          fileName, validationErrors: errors, summary });
  },

  updateStudent: (index, updates) =>
    set((state) => {
      const updated = state.students.map((s, i) =>
        i === index ? { ...s, ...updates } : s
      );
      return { students: updated, summary: calcSummary(updated) };
    }),

  toggleParticipation: (index) =>
    set((state) => {
      const updated = state.students.map((s, i) =>
        i === index ? { ...s, isParticipating: !s.isParticipating } : s
      );
      return { students: updated, summary: calcSummary(updated) };
    }),

  clearStudents: () =>
    set({ students: [], isLoaded: false, loadedAt: null,
          fileName: null, validationErrors: [], summary: null }),

  buildSummary: () => {
    const summary = calcSummary(get().students);
    set({ summary });
    return summary;
  },

  getParticipatingStudents: () =>
    get().students.filter((s) => s.isParticipating),

  getStudentsByGradeClass: (grade, className) =>
    get().students.filter((s) => s.grade === grade && s.className === className),
}));

export const registerStudentDataCleanup = () => {
  const cleanup = () => useStudentStore.getState().clearStudents();
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide',     cleanup);
  return () => {
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('pagehide',     cleanup);
  };
};
