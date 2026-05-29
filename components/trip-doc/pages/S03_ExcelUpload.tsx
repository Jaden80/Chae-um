import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useSchoolStore } from '@/store/schoolStore';
import { useStudentStore } from '@/store/studentStore';
import { useTripStore } from '@/store/tripStore';
import { parseStaffExcel, parseStudentExcel, downloadStaffTemplate, downloadStudentTemplate } from '@/utils/excelParser';
import type { StaffRow, Teacher } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Badge from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';
import { ConfirmModal } from '@/components/trip-doc/common/Modal';

function ExcelDropzone({ onFile, isLoading, label, sublabel }: {
  onFile: (f: File) => void; isLoading: boolean; label: string; sublabel: string;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1, disabled: isLoading,
    onDrop: (acc) => { if (acc[0]) onFile(acc[0]); },
  });
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
      ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-neutral-300 hover:border-blue-400 hover:bg-neutral-50'}
      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input {...getInputProps()} />
      <svg className="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{sublabel}</p>
    </div>
  );
}

export default function S03_ExcelUpload() {
  const router = useRouter();
  const toast    = useToast();
  const { setStaffFromExcel, staffLoadedAt, teachers, principal } = useSchoolStore();
  const { loadStudents, isLoaded: studentsLoaded, summary } = useStudentStore();
  const { completeStep, setCurrentStep } = useTripStore();
  const [staffLoading,   setStaffLoading]   = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [staffErrors,    setStaffErrors]    = useState<string[]>([]);
  const [studentErrors,  setStudentErrors]  = useState<string[]>([]);
  const [showSkip, setShowSkip] = useState(false);

  const handleStaffFile = useCallback(async (file: File) => {
    setStaffLoading(true); setStaffErrors([]);
    try {
      const result = await parseStaffExcel(file);
      const rows   = result.data as StaffRow[];
      const critical = result.errors.filter((e) => !e.message.includes('경고'));
      if (critical.length > 0) { setStaffErrors(critical.map((e) => `행 ${e.row}: ${e.message}`)); toast.error(`${critical.length}개 오류가 있습니다.`); return; }
      const allTeachers: Teacher[] = rows.map((r, i) => ({
        id: `teacher-${i}`, name: r.name, position: r.position,
        grade: r.grade, classNm: r.className, phone: r.phone, role: r.role, isLeader: r.role?.includes('총책임자') ?? false,
      }));
      setStaffFromExcel({
        principal:  allTeachers.find((t) => t.position === '교장'),
        vPrincipal: allTeachers.find((t) => t.position === '교감'),
        admin:      allTeachers.find((t) => t.position === '행정실장'),
        teachers:   allTeachers.filter((t) => !['교장','교감','행정실장'].includes(t.position)),
      });
      toast.success(`교직원 ${result.validRows}명 등록 완료`);
      if (result.errors.length > 0) setStaffErrors(result.errors.map((e) => `행 ${e.row}: ${e.message}`));
    } catch (err) { toast.error(err instanceof Error ? err.message : '파일 처리 실패'); }
    finally { setStaffLoading(false); }
  }, [setStaffFromExcel, toast]);

  const handleStudentFile = useCallback(async (file: File) => {
    setStudentLoading(true); setStudentErrors([]);
    try {
      const result = await parseStudentExcel(file);
      const critical = result.errors.filter((e) => !e.message.includes('경고'));
      if (critical.length > 0) { setStudentErrors(critical.map((e) => `행 ${e.row}: ${e.message}`)); toast.error(`${critical.length}개 오류가 있습니다.`); return; }
      loadStudents(result.data as any, file.name, result.errors.map((e) => `행 ${e.row}: ${e.message}`));
      toast.success(`학생 ${result.validRows}명 메모리 적재 완료`);
    } catch (err) { toast.error(err instanceof Error ? err.message : '파일 처리 실패'); }
    finally { setStudentLoading(false); }
  }, [loadStudents, toast]);

  const handleNext = () => {
    if (!staffLoadedAt && teachers.length === 0) { setShowSkip(true); return; }
    completeStep(3); setCurrentStep(4); router.push('/doc-wizard/step/place');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 2 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">엑셀 업로드</h1>
        <p className="text-sm text-neutral-500 mt-1">교직원 정보(연초 1회)와 학생 정보(행사별)를 엑셀로 업로드합니다.</p>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
        학생 정보는 브라우저 메모리에만 임시 저장되며, 탭 종료 시 즉시 삭제됩니다.
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Template-A 교직원 정보</h3>
            <p className="text-xs text-neutral-500">교장·교감·인솔교사 성명·연락처 (연초 1회 작성)</p>
          </div>
          <div className="flex items-center gap-2">
            {staffLoadedAt && <Badge variant="success" dot>마이페이지 연동됨</Badge>}
            <Button variant="outline" size="sm" onClick={() => router.push('/mypage')}>마이페이지 관리</Button>
            <Button variant="ghost" size="sm" onClick={downloadStaffTemplate}>템플릿 다운로드</Button>
          </div>
        </div>
        <ExcelDropzone onFile={handleStaffFile} isLoading={staffLoading}
          label="교직원 엑셀 파일을 드래그하거나 클릭하세요" sublabel="Template_A_교직원정보.xlsx" />
        {staffErrors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {staffErrors.slice(0, 5).map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}
        {staffLoadedAt && teachers.length > 0 && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            등록된 교사: {teachers.length}명{principal ? ` · 교장: ${principal.name}` : ''}
          </div>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Template-B 학생 정보</h3>
            <p className="text-xs text-neutral-500">학생 명단·보호자 연락처·요양호·경비지원 (행사별)</p>
          </div>
          <div className="flex items-center gap-2">
            {studentsLoaded && <Badge variant="success" dot>적재됨</Badge>}
            <Button variant="ghost" size="sm" onClick={downloadStudentTemplate}>템플릿 다운로드</Button>
          </div>
        </div>
        <ExcelDropzone onFile={handleStudentFile} isLoading={studentLoading}
          label="학생 명단 엑셀 파일을 드래그하거나 클릭하세요" sublabel="Template_B_학생명단.xlsx" />
        {studentErrors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {studentErrors.slice(0, 5).map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}
        {studentsLoaded && summary && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {[
              { l:'전체', v:summary.total,            c:'text-neutral-700' },
              { l:'참가', v:summary.participating,    c:'text-green-600'   },
              { l:'미참가',v:summary.nonParticipating,c:'text-neutral-500' },
              { l:'요양호',v:summary.specialNeeds,    c:'text-amber-600'   },
              { l:'지원', v:summary.subsidyNeeded,    c:'text-blue-600'    },
            ].map(({ l, v, c }) => (
              <div key={l} className="bg-neutral-50 rounded p-2 text-center">
                <p className={`text-base font-bold ${c}`}>{v}</p>
                <p className="text-xs text-neutral-500">{l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/type')}>이전</Button>
        <Button onClick={handleNext}
          iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
          다음 단계
        </Button>
      </div>
      <ConfirmModal isOpen={showSkip} onClose={() => setShowSkip(false)}
        onConfirm={() => { completeStep(3); setCurrentStep(4); router.push('/doc-wizard/step/place'); }}
        title="엑셀 업로드 건너뛰기"
        message="교직원·학생 정보를 업로드하지 않으면 서류 일부 항목이 '[확인 필요]'로 표시됩니다. 계속하시겠습니까?"
        confirmLabel="건너뛰기" />
    </div>
  );
}
