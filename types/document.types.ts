export type DocumentId =
  | 'p01_tripPlan'
  | 'p02_consentForm'
  | 'p03_safetyPlan'
  | 'p04_emergencyContact'
  | 'p05_scheduleTable'
  | 'p06_budgetPlan'
  | 'p07_committeeMinutes'
  | 'p08_boardProposal'
  | 'p09_departureSafety'
  | 'p10_staffAssignment'
  | 'p11_studentList'
  | 'p12_accommodationPlan'
  | 'p13_mealPlan'
  | 'p14_reportForm';

export type DocumentStatus =
  | 'pending'
  | 'generating'
  | 'done'
  | 'error'
  | 'skipped';

export interface DocumentMeta {
  id: DocumentId;
  title: string;
  description: string;
  applicableTypes: ('day' | 'training' | 'tour')[];
  autoFillRate: number;
  isRequired: boolean;
  order: number;
}

export interface Document {
  id: DocumentId;
  meta: DocumentMeta;
  status: DocumentStatus;
  content: DocumentContent | null;
  generatedAt?: string;
  editedAt?: string;
  errorMessage?: string;
}

export interface DocumentContent {
  title: string;
  sections: DocumentSection[];
  rawText?: string;
}

export interface DocumentSection {
  heading: string;
  body: string;
  tableData?: string[][];
  isEdited?: boolean;
}

export type OutputFormat = 'pdf' | 'docx';

export interface OutputRequest {
  documents: DocumentId[];
  format: OutputFormat;
  includeAll: boolean;
}
