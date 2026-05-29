import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentStore } from '@/store/documentStore';
import { useSchoolStore }   from '@/store/schoolStore';
import { useTripStore }     from '@/store/tripStore';
import { exportDocuments }  from '@/utils/pdfExporter';
import { generateEdufineHtml, copyHtmlToClipboard } from '@/utils/clipboard';
import type { OutputFormat } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Badge  from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';
import { ConfirmModal } from '@/components/trip-doc/common/Modal';

export default function S09_Output() {
  const router = useRouter();
  const toast    = useToast();

  // 서류/출력 상태 (documentStore)
  const { documents, selectedIds, outputFormat, setOutputFormat, isExporting, setExporting, setExportError } = useDocumentStore();
  // 단계 이동 (tripStore)
  const { completeStep, setCurrentStep, resetAll: resetTrip } = useTripStore();
  const { selectedSchool } = useSchoolStore();

  const [showReset, setShowReset] = useState(false);
  const schoolName = selectedSchool?.schulNm ?? '학교명';
  const doneDocs   = selectedIds.map((id) => documents[id]).filter((d) => d?.status === 'done');

  const handleExportAll = async () => {
    if (doneDocs.length === 0) { toast.warning('출력할 서류가 없습니다.'); return; }
    setExporting(true);
    try {
      await exportDocuments(doneDocs, outputFormat, schoolName);
      toast.success(`${doneDocs.length}종 서류를 ${outputFormat.toUpperCase()}로 저장했습니다.`);
      completeStep(9); setCurrentStep(9);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '출력 실패';
      setExportError(msg); toast.error(msg);
    } finally { setExporting(false); }
  };

  const handleExportSingle = async (id: string) => {
    const doc = documents[id as keyof typeof documents];
    if (!doc) return;
    setExporting(true);
    try {
      await exportDocuments(doneDocs, outputFormat, schoolName, doc);
      toast.success(`${doc.meta.title} 저장 완료`);
    } catch (err) { toast.error(err instanceof Error ? err.message : '출력 실패'); }
    finally { setExporting(false); }
  };

  const handleEdufineCopy = async (id: string) => {
    const doc = documents[id as keyof typeof documents];
    if (!doc) return;
    
    const htmlString = generateEdufineHtml(doc);
    const success = await copyHtmlToClipboard(htmlString);
    
    if (success) {
      toast.success('에듀파인 기안용 서식이 클립보드에 복사되었습니다. K-에듀파인 기안문에 붙여넣기(Ctrl+V) 하세요.');
    } else {
      toast.error('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 7 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">출력</h1>
        <p className="text-sm text-neutral-500 mt-1">서류를 PDF 또는 DOCX 파일로 저장합니다.</p>
      </div>

      <div className="card mb-4">
        <p className="text-sm font-semibold mb-3">출력 형식</p>
        <div className="flex gap-3">
          {(['pdf', 'docx'] as OutputFormat[]).map((fmt) => (
            <button key={fmt} onClick={() => setOutputFormat(fmt)}
              className={`flex-1 py-3 rounded-md border-2 text-center transition-all
                ${outputFormat === fmt ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-blue-300'}`}>
              <p className="text-sm font-bold uppercase">{fmt}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{fmt === 'pdf' ? '인쇄·공유 최적화' : 'Word 편집 가능'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">출력 대상 서류</p>
          <Badge variant="primary">{doneDocs.length}종</Badge>
        </div>
        <ul className="space-y-1.5">
          {doneDocs.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-neutral-700">{doc.meta.title}</span>
                {doc.editedAt && <Badge variant="warning" size="sm">수정됨</Badge>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdufineCopy(doc.id)}
                  className="text-xs text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">
                  내용 복사
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={handleExportAll} loading={isExporting} fullWidth size="lg" className="mb-4"
        iconLeft={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}>
        {doneDocs.length}종 전체 저장 ({outputFormat.toUpperCase()} + ZIP)
      </Button>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/preview')}>이전</Button>
        <Button variant="ghost" onClick={() => setShowReset(true)}>새 체험학습 시작</Button>
      </div>

      <ConfirmModal isOpen={showReset} onClose={() => setShowReset(false)}
        onConfirm={() => { resetTrip(); router.push('/doc-wizard/step/type'); }}
        title="새 체험학습 시작" message="현재 작업 내용이 초기화됩니다. 계속하시겠습니까?"
        confirmLabel="초기화 후 시작" danger />
    </div>
  );
}
