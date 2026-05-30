import * as XLSX from 'xlsx';
import type { StaffRow, StudentRow, ExcelUploadResult, ExcelValidationError, ExcelTemplateType } from '@/types';

const toString  = (v: unknown): string => (v === null || v === undefined) ? '' : String(v).trim();
const toBool    = (v: unknown): boolean => ['o','y','1','참','예','true'].includes(toString(v).toLowerCase());
const normPhone = (v: unknown): string => toString(v).replace(/[^\d-]/g, '');
const validPhone = (p: string): boolean => /^0\d{9,10}$/.test(p.replace(/-/g, ''));

const sheetToRows = (wb: XLSX.WorkBook, idx = 0): Record<string, unknown>[] => {
  const ws = wb.Sheets[wb.SheetNames[idx]];
  if (!ws) throw new Error('시트를 찾을 수 없습니다.');
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
};

export const parseStaffExcel = (file: File): Promise<ExcelUploadResult<StaffRow>> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const errors: ExcelValidationError[] = [];
      const data: StaffRow[] = [];
      try {
        const wb   = XLSX.read(e.target?.result as ArrayBuffer, { type: 'array' });
        const rows = sheetToRows(wb, 0);
        if (!rows.length) { resolve({ success: false, data: [], errors: [{ row: 0, column: '-', message: '데이터가 없습니다.' }], totalRows: 0, validRows: 0 }); return; }
        rows.forEach((row, idx) => {
          const rowNum   = idx + 2;
          const name     = toString(row['성명'] ?? row['이름']);
          const position = toString(row['직위'] ?? row['직책']);
          const phone    = normPhone(row['연락처'] ?? row['전화번호'] ?? '');
          const grade    = toString(row['학년'] ?? '');
          const className = toString(row['학급'] ?? row['반'] ?? '');
          const role     = toString(row['체험학습 역할'] ?? row['역할'] ?? '');
          if (!name)  { errors.push({ row: rowNum, column: '성명', message: '성명이 비어 있습니다.' }); return; }
          if (!position) { errors.push({ row: rowNum, column: '직위', message: '직위가 비어 있습니다.' }); return; }
          if (!phone || !validPhone(phone)) { errors.push({ row: rowNum, column: '연락처', message: `'${phone}'은 유효하지 않은 전화번호입니다.`, value: phone }); return; }
          data.push({ name, position, grade: grade || undefined, className: className || undefined, phone, role: role || undefined });
        });
        resolve({ success: errors.length === 0, data, errors, totalRows: rows.length, validRows: data.length });
      } catch (err) {
        resolve({ success: false, data: [], errors: [{ row: 0, column: '-', message: `파일 파싱 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` }], totalRows: 0, validRows: 0 });
      }
    };
    reader.onerror = () => resolve({ success: false, data: [], errors: [{ row: 0, column: '-', message: '파일을 읽을 수 없습니다.' }], totalRows: 0, validRows: 0 });
    reader.readAsArrayBuffer(file);
  });

export const parseStudentExcel = (file: File): Promise<ExcelUploadResult<StudentRow>> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const errors: ExcelValidationError[] = [];
      const data: StudentRow[] = [];
      try {
        const wb   = XLSX.read(e.target?.result as ArrayBuffer, { type: 'array' });
        const rows = sheetToRows(wb, 0);
        if (!rows.length) { resolve({ success: false, data: [], errors: [{ row: 0, column: '-', message: '데이터가 없습니다.' }], totalRows: 0, validRows: 0 }); return; }
        rows.forEach((row, idx) => {
          const rowNum      = idx + 2;
          const grade       = toString(row['학년']);
          const className   = toString(row['학급'] ?? row['반']);
          const number      = toString(row['번호']);
          const name        = toString(row['이름'] ?? row['성명']);
          const genderRaw   = toString(row['성별'] ?? '');
          const parentPhone = normPhone(row['보호자연락처'] ?? row['보호자 연락처'] ?? '');
          const isParticipating = !toBool(row['미참가'] ?? row['불참'] ?? '');
          const nonParticipateReason = toString(row['미참가사유'] ?? '');
          const hasSpecialNeeds  = toBool(row['요양호'] ?? '');
          const specialNeedsDetail = toString(row['요양호내용'] ?? row['요양호 내용'] ?? '');
          const needsSubsidy = toBool(row['경비지원'] ?? '');
          const allergyInfo  = toString(row['알레르기'] ?? '');
          let hasError = false;
          if (!grade)   { errors.push({ row: rowNum, column: '학년', message: '학년이 비어 있습니다.' }); hasError = true; }
          if (!className) { errors.push({ row: rowNum, column: '학급', message: '학급이 비어 있습니다.' }); hasError = true; }
          if (!name)    { errors.push({ row: rowNum, column: '이름', message: '이름이 비어 있습니다.' }); hasError = true; }
          if (!parentPhone || !validPhone(parentPhone)) { errors.push({ row: rowNum, column: '보호자연락처', message: `'${parentPhone}'은 유효하지 않은 전화번호입니다.`, value: parentPhone }); hasError = true; }
          if (hasError) return;
          const gender: 'M' | 'F' = ['여','f','female','2'].includes(genderRaw.toLowerCase()) ? 'F' : 'M';
          data.push({ grade, className, number, name, gender, parentPhone, isParticipating,
            nonParticipateReason: nonParticipateReason || undefined, hasSpecialNeeds,
            specialNeedsDetail: specialNeedsDetail || undefined, needsSubsidy,
            allergyInfo: allergyInfo || undefined });
        });
        resolve({ success: errors.length === 0, data, errors, totalRows: rows.length, validRows: data.length });
      } catch (err) {
        resolve({ success: false, data: [], errors: [{ row: 0, column: '-', message: `파일 파싱 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` }], totalRows: 0, validRows: 0 });
      }
    };
    reader.onerror = () => resolve({ success: false, data: [], errors: [{ row: 0, column: '-', message: '파일을 읽을 수 없습니다.' }], totalRows: 0, validRows: 0 });
    reader.readAsArrayBuffer(file);
  });

export const downloadStaffTemplate = (): void => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['성명','직위','학년','학급','연락처','체험학습 역할'],
    ['홍길동','교장','','','010-1234-5678','총괄책임자'],
    ['김철수','교감','','','010-2345-6789','안전총괄'],
    ['이영희','담임교사','1','1','010-3456-7890','1학년 1반 인솔'],
  ]);
  ws['!cols'] = [{ wch:10 },{ wch:12 },{ wch:6 },{ wch:6 },{ wch:15 },{ wch:20 }];
  XLSX.utils.book_append_sheet(wb, ws, '교직원정보');
  XLSX.writeFile(wb, '교직원정보.xlsx');
};

export const downloadStudentTemplate = (): void => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['학년','학급','번호','이름','성별','보호자연락처','미참가','미참가사유','요양호','요양호내용','경비지원','알레르기'],
    ['1','1','1','김민준','남','010-1111-2222','','','','','',''],
    ['1','1','2','이수아','여','010-3333-4444','','','O','천식','',''],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '학생명단');
  XLSX.writeFile(wb, '학생명단.xlsx');
};

export const parseExcelFile = (file: File, type: ExcelTemplateType): Promise<ExcelUploadResult<StaffRow | StudentRow>> => {
  if (type === 'staff')   return parseStaffExcel(file);
  if (type === 'student') return parseStudentExcel(file);
  throw new Error(`알 수 없는 템플릿 유형: ${type}`);
};
