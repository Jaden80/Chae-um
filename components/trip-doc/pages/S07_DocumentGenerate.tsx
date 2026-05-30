import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentStore, DOCUMENT_META_LIST } from '@/store/documentStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useStudentStore } from '@/store/studentStore';
import { useTripStore } from '@/store/tripStore';
import type { DocumentId } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import { useToast } from '@/components/trip-doc/common/Toast';

export default function S07_DocumentGenerate() {
  const router = useRouter();
  const toast    = useToast();
  const abortRef = useRef(false);
  const { documents, setDocumentStatus, setDocumentContent, setGeneratingId,
    getDoneCount, addTokenUsage, totalTokenUsed } = useDocumentStore();
  const { tripType, plan, place, places, route, weather, completeStep, setCurrentStep } = useTripStore();
  const { buildSnapshot, principal, vPrincipal, admin, teachers: staffTeachers } = useSchoolStore();
  const { summary: studentSummary, students } = useStudentStore();
  const [isRunning,  setIsRunning]  = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const applicableDocs = DOCUMENT_META_LIST.filter((m) => tripType && m.applicableTypes.includes(tripType));
  const [selectedDocs, setSelectedDocs] = useState<Set<DocumentId>>(() => new Set(applicableDocs.map(d => d.id)));

  const targetDocs  = applicableDocs.filter((m) => selectedDocs.has(m.id));
  const targetTotal = targetDocs.length;
  const targetDone  = targetDocs.filter((m) => documents[m.id]?.status === 'done').length;
  const progress    = targetTotal > 0 ? Math.round((targetDone / targetTotal) * 100) : 0;

  const handleToggleAll = (select: boolean) => {
    if (isRunning) return;
    setSelectedDocs(select ? new Set(applicableDocs.map(d => d.id)) : new Set());
  };

  const handleToggleDoc = (id: DocumentId) => {
    if (isRunning) return;
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (isRunning) return;
    abortRef.current = false; setIsRunning(true);
    const snapshot = buildSnapshot();
    const enrichedPlan = {
      ...plan,
      totalStudents:        studentSummary?.total          ?? plan.totalStudents,
      nonParticipants:      studentSummary?.nonParticipating ?? plan.nonParticipants,
      specialNeedsStudents: studentSummary?.specialNeeds   ?? plan.specialNeedsStudents,
      subsidyStudents:      studentSummary?.subsidyNeeded  ?? plan.subsidyStudents,
    };

    // 안전-Pick에서 저장된 학교명 및 체험 일시 읽기
    let safetyPickContext: { schoolName?: string; schoolAddress?: string; tripDate?: string; grade?: number } = {};
    try {
      const profile = localStorage.getItem('safety_pick_teacher_profile');
      const tripDate = localStorage.getItem('safety_pick_trip_date');
      if (profile) {
        const p = JSON.parse(profile);
        safetyPickContext.schoolName    = p.schoolName    || undefined;
        safetyPickContext.schoolAddress = p.schoolAddress || undefined;
        safetyPickContext.grade         = p.grade         ? Number(p.grade) : undefined;
      }
      if (tripDate) safetyPickContext.tripDate = tripDate;
    } catch {}

    for (let i = 0; i < applicableDocs.length; i++) {
      if (abortRef.current) break;
      const meta = applicableDocs[i];
      if (!selectedDocs.has(meta.id)) continue;
      if (documents[meta.id]?.status === 'done') continue;
      setCurrentIdx(i); setGeneratingId(meta.id); setDocumentStatus(meta.id, 'generating');
      try {
        // Firebase Functions 대신 Next.js API 라우트 직접 호출
        const res = await fetch('/api/document/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId:       meta.id,
            tripPlan:         enrichedPlan,
            schoolSnapshot:   snapshot,
            staffInfo:        { principal, vPrincipal, admin, teachers: staffTeachers },
            placeInfo:        place,
            placesInfo:       places,
            weatherInfo:      weather.length > 0 ? { forecast: weather.slice(0, 8) } : undefined,
            routeInfo:        route,
            safetyPickContext, // 안전-Pick 학교명·날짜 전달
            students, // 엑셀에서 업로드된 학생 데이터 추가
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error || `서버 오류 (${res.status})`);
        }

        const result = await res.json();
        if (!result.success) throw new Error(result.error || '생성 실패');

        setDocumentContent(meta.id, result.content);
        addTokenUsage(result.tokenUsage?.totalTokens ?? 0);

        // Gemini 오류 발생 시 경고 표시 (Mock 문서로 대체됨)
        if (result.geminiError) {
          console.warn(`[S07] Gemini 실패 (${meta.id}):`, result.geminiError);
          toast.warning(`${meta.title}: AI 생성 실패, 기본 양식 사용 — ${result.geminiError.substring(0, 60)}`);
        }

        if (i < applicableDocs.length - 1) await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        const msg = err instanceof Error ? err.message : '생성 실패';
        setDocumentStatus(meta.id, 'error', msg);
        toast.error(`${meta.title} 생성 실패: ${msg}`);
      }
    }
    setGeneratingId(null); setIsRunning(false);
    toast.success('서류 생성 완료!');
  };

  const statusIcon = (id: DocumentId) => {
    const s = documents[id]?.status;
    if (s === 'done')      return <span className="text-green-500 text-sm">✓</span>;
    if (s === 'generating') return <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    if (s === 'error')     return <span className="text-red-500 text-sm">✕</span>;
    if (s === 'skipped')   return <span className="text-neutral-300 text-sm">—</span>;
    return <span className="text-neutral-300 text-sm">○</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 5 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">서류 자동 생성</h1>
        <p className="text-sm text-neutral-500 mt-1">Gemini AI가 수집된 정보를 바탕으로 서류 초안을 생성합니다.</p>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{targetDone} / {targetTotal} 종 완료</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">토큰 {totalTokenUsed.toLocaleString()}</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
        </div>
        {isRunning && <p className="text-xs text-neutral-500 mt-2">생성 중: {applicableDocs[currentIdx]?.title ?? '...'}</p>}
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-semibold text-neutral-400">서류 ({applicableDocs.length}종)</p>
          <div className="text-xs">
            <button onClick={() => handleToggleAll(true)} className="text-blue-600 hover:underline disabled:opacity-50" disabled={isRunning}>전체선택</button>
            <span className="text-neutral-300 mx-1.5">|</span>
            <button onClick={() => handleToggleAll(false)} className="text-neutral-500 hover:underline disabled:opacity-50" disabled={isRunning}>해제</button>
          </div>
        </div>
        <ul className="space-y-1.5">
          {applicableDocs.map((meta, i) => {
            const doc = documents[meta.id];
            const isActive = isRunning && applicableDocs[currentIdx]?.id === meta.id;
            const isSelected = selectedDocs.has(meta.id);
            return (
              <li key={meta.id} className={`flex items-center gap-3 px-2 py-1.5 rounded text-sm ${isActive ? 'bg-blue-50' : ''} ${!isSelected ? 'opacity-60' : ''}`}>
                <span className="flex justify-center shrink-0">
                  <input type="checkbox" checked={isSelected} onChange={() => handleToggleDoc(meta.id)} disabled={isRunning} 
                    className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                </span>
                <span className={`flex-1 ${doc?.status === 'done' ? 'text-neutral-700' : doc?.status === 'error' ? 'text-red-500' : 'text-neutral-500'}`}>
                  {meta.title}
                </span>
                <span className="text-xs text-neutral-400">자동화 {meta.autoFillRate}%</span>
              </li>
            );
          })}
        </ul>
      </div>

      {!isRunning && Object.values(documents).some((d) => d.status === 'error') && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          일부 서류 생성에 실패했습니다. 다시 실행하면 실패한 서류만 재생성합니다.
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/input')} disabled={isRunning}>이전</Button>
        <div className="flex gap-2">
          {isRunning ? (
            <Button variant="danger" onClick={() => { abortRef.current = true; toast.warning('생성을 중단합니다...'); }}>중단</Button>
          ) : (
            <Button variant="secondary" onClick={handleGenerate} disabled={targetTotal === 0}>
              {targetDone > 0 ? '재생성' : '생성 시작'}
            </Button>
          )}
          <Button onClick={() => { completeStep(7); setCurrentStep(8); router.push('/doc-wizard/step/preview'); }}
            disabled={targetDone === 0 || isRunning}
            iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
            미리보기
          </Button>
        </div>
      </div>
    </div>
  );
}
