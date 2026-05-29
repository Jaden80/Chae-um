export interface StaffRow {
  name: string;
  position: string;
  grade?: string;
  className?: string;
  phone: string;
  role?: string;
}

export interface StudentRow {
  grade: string;
  className: string;
  number: string;
  name: string;
  gender: 'M' | 'F';
  parentPhone: string;
  isParticipating: boolean;
  nonParticipateReason?: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetail?: string;
  needsSubsidy: boolean;
  allergyInfo?: string;
}

export interface ExcelUploadResult<T> {
  success: boolean;
  data: T[];
  errors: ExcelValidationError[];
  totalRows: number;
  validRows: number;
}

export interface ExcelValidationError {
  row: number;
  column: string;
  message: string;
  value?: unknown;
}

export type ExcelTemplateType = 'staff' | 'student';
