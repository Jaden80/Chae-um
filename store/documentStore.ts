import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Document, DocumentId, DocumentMeta, DocumentContent,
              DocumentStatus, OutputFormat, TripType } from '@/types';

export const DOCUMENT_META_LIST: DocumentMeta[] = [
  { id: 'p01_tripPlan',         title: '현장체험학습 실시 계획서',    description: '전체 운영 계획, 목적·일정·예산 총괄',         applicableTypes: ['day','training','tour'], autoFillRate: 85, isRequired: true,  order: 1  },
  { id: 'p02_consentForm',      title: '학부모 동의서 및 안내문',     description: '학부모 대상 안내 및 동의 서명 양식',          applicableTypes: ['day','training','tour'], autoFillRate: 90, isRequired: true,  order: 2  },
  { id: 'p03_safetyPlan',       title: '안전사고 예방 및 대책 계획서', description: '인솔 교사 역할, 안전 수칙, 사고 대응 절차',  applicableTypes: ['day','training','tour'], autoFillRate: 80, isRequired: true,  order: 3  },
  { id: 'p04_emergencyContact', title: '비상연락체계표',              description: '교사·학부모·인근 병원·응급실 연락처',         applicableTypes: ['day','training','tour'], autoFillRate: 75, isRequired: true,  order: 4  },
  { id: 'p05_scheduleTable',    title: '세부 일정표',                 description: '시간대별 이동·체험·식사·숙박 일정',           applicableTypes: ['day','training','tour'], autoFillRate: 70, isRequired: true,  order: 5  },
  { id: 'p06_budgetPlan',       title: '예산 운영 계획서',            description: '수입·지출 항목 상세, 경비 지원 내역',         applicableTypes: ['day','training','tour'], autoFillRate: 65, isRequired: true,  order: 6  },
  { id: 'p07_committeeMinutes', title: '소위원회 회의록',             description: '현장체험학습 심의 소위원회 회의 기록',        applicableTypes: ['training','tour'],       autoFillRate: 80, isRequired: true,  order: 7  },
  { id: 'p08_boardProposal',    title: '학교운영위원회 의안 제안서',  description: '학교운영위 심의 의안 제출 문서',             applicableTypes: ['training','tour'],       autoFillRate: 85, isRequired: true,  order: 8  },
  { id: 'p09_departureSafety',  title: '출발일 안전 점검표',          description: '출발 전 차량·학생·인솔 교사 최종 점검',       applicableTypes: ['day','training','tour'], autoFillRate: 90, isRequired: true,  order: 9  },
  { id: 'p10_staffAssignment',  title: '인솔 교사 업무 분장표',       description: '교사별 역할·담당 학급·야간 지도 계획',        applicableTypes: ['day','training','tour'], autoFillRate: 80, isRequired: true,  order: 10 },
  { id: 'p11_studentList',      title: '학생 명단 및 참가 현황',      description: '참가·미참가·요양호·경비지원 대상 학생 목록',  applicableTypes: ['day','training','tour'], autoFillRate: 95, isRequired: true,  order: 11 },
  { id: 'p12_accommodationPlan',title: '숙박 배정 계획표',            description: '숙소별 방 배정, 학생·교사 호실 현황',         applicableTypes: ['training','tour'],       autoFillRate: 70, isRequired: false, order: 12 },
  { id: 'p13_mealPlan',         title: '식단 및 식사 계획표',         description: '끼니별 메뉴, 식당 정보, 알레르기 학생 관리',  applicableTypes: ['training','tour'],       autoFillRate: 60, isRequired: false, order: 13 },
  { id: 'p14_reportForm',       title: '현장체험학습 결과 보고서',    description: '실시 후 제출하는 결과 정리 양식',             applicableTypes: ['day','training','tour'], autoFillRate: 60, isRequired: false, order: 14 },
];

interface DocumentState {
  documents:     Record<DocumentId, Document>;
  selectedIds:   DocumentId[];
  generatingId:  DocumentId | null;
  outputFormat:  OutputFormat;
  isExporting:   boolean;
  exportError:   string | null;
  totalTokenUsed: number;

  initDocuments:      (tripType: TripType) => void;
  setDocumentStatus:  (id: DocumentId, status: DocumentStatus, errorMessage?: string) => void;
  setDocumentContent: (id: DocumentId, content: DocumentContent) => void;
  updateSection:      (id: DocumentId, sectionIndex: number, body: string) => void;
  toggleSelect:       (id: DocumentId) => void;
  selectAll:          () => void;
  deselectAll:        () => void;
  setGeneratingId:    (id: DocumentId | null) => void;
  setOutputFormat:    (format: OutputFormat) => void;
  setExporting:       (v: boolean) => void;
  setExportError:     (error: string | null) => void;
  addTokenUsage:      (tokens: number) => void;
  getApplicableDocuments: (tripType: TripType) => Document[];
  getDocumentsByStatus:   (status: DocumentStatus) => Document[];
  getDoneCount:           () => number;
  resetAll:               () => void;
}

const buildInitialDocument = (meta: DocumentMeta): Document =>
  ({ id: meta.id, meta, status: 'pending', content: null });

const buildInitialDocuments = (): Record<DocumentId, Document> =>
  DOCUMENT_META_LIST.reduce((acc, meta) => {
    acc[meta.id] = buildInitialDocument(meta);
    return acc;
  }, {} as Record<DocumentId, Document>);

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents:      buildInitialDocuments(),
      selectedIds:    [],
      generatingId:   null,
      outputFormat:   'pdf',
      isExporting:    false,
      exportError:    null,
      totalTokenUsed: 0,

      initDocuments: (tripType) => {
        const docs = buildInitialDocuments();
        DOCUMENT_META_LIST.forEach((meta) => {
          if (!meta.applicableTypes.includes(tripType)) docs[meta.id].status = 'skipped';
        });
        const applicableIds = DOCUMENT_META_LIST
          .filter((m) => m.applicableTypes.includes(tripType) && m.isRequired)
          .map((m) => m.id);
        set({ documents: docs, selectedIds: applicableIds, totalTokenUsed: 0 });
      },

      setDocumentStatus: (id, status, errorMessage) =>
        set((state) => ({ documents: { ...state.documents,
          [id]: { ...state.documents[id], status, errorMessage } } })),

      setDocumentContent: (id, content) =>
        set((state) => ({ documents: { ...state.documents,
          [id]: { ...state.documents[id], content, status: 'done',
                  generatedAt: new Date().toISOString() } } })),

      updateSection: (id, sectionIndex, body) =>
        set((state) => {
          const doc = state.documents[id];
          if (!doc.content) return state;
          const updatedSections = doc.content.sections.map((s, i) =>
            i === sectionIndex ? { ...s, body, isEdited: true } : s
          );
          return { documents: { ...state.documents, [id]: { ...doc,
            content: { ...doc.content, sections: updatedSections },
            editedAt: new Date().toISOString() } } };
        }),

      toggleSelect: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((i) => i !== id)
            : [...state.selectedIds, id],
        })),

      selectAll: () =>
        set((state) => ({
          selectedIds: DOCUMENT_META_LIST
            .filter((m) => state.documents[m.id].status === 'done')
            .map((m) => m.id),
        })),

      deselectAll:       () => set({ selectedIds: [] }),
      setGeneratingId:   (generatingId) => set({ generatingId }),
      setOutputFormat:   (outputFormat)  => set({ outputFormat }),
      setExporting:      (isExporting)   => set({ isExporting }),
      setExportError:    (exportError)   => set({ exportError }),
      addTokenUsage:     (tokens)        =>
        set((state) => ({ totalTokenUsed: state.totalTokenUsed + tokens })),

      getApplicableDocuments: (tripType) =>
        DOCUMENT_META_LIST
          .filter((m) => m.applicableTypes.includes(tripType))
          .map((m) => get().documents[m.id])
          .sort((a, b) => a.meta.order - b.meta.order),

      getDocumentsByStatus: (status) =>
        Object.values(get().documents).filter((d) => d.status === status),

      getDoneCount: () =>
        Object.values(get().documents).filter((d) => d.status === 'done').length,

      resetAll: () => set({ documents: buildInitialDocuments(),
        selectedIds: [], generatingId: null, isExporting: false,
        exportError: null, totalTokenUsed: 0 }),
    }),
    {
      name:    'trip-doc-documents',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
