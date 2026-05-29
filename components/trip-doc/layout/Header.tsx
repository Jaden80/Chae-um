'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import StepIndicator from '@/components/trip-doc/common/StepIndicator';
import { useTripStore } from '@/store/tripStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useStudentStore } from '@/store/studentStore';
import { useDocumentStore } from '@/store/documentStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ConfirmModal } from '@/components/trip-doc/common/Modal';

export default function Header() {
  const router       = useRouter();
  const tripType     = useTripStore((s) => s.tripType);
  const getTripLabel = useTripStore((s) => s.getTripLabel);
  const resetTrip     = useTripStore((s) => s.resetAll);
  const resetSchool   = useSchoolStore((s) => s.resetAll);
  const clearStudents = useStudentStore((s) => s.clearStudents);
  const resetDocs     = useDocumentStore((s) => s.resetAll);
  
  const isReady      = useSettingsStore((s) => s.isAllRequiredApiReady());
  const [showReset, setShowReset] = useState(false);

  const handleGlobalReset = () => {
    resetTrip();
    resetSchool();
    clearStudents();
    resetDocs();
    router.push('/doc-wizard/step/type');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 h-14 flex items-center px-4 gap-4 shrink-0">
        <button onClick={() => router.push('/search')}
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <img src="/chae_um_logo.png" alt="채움 로고" className="w-7 h-7 rounded-md object-cover" />
          <span className="font-bold text-neutral-900 text-sm hidden sm:block">채움</span>
        </button>

        <div className="w-px h-5 bg-neutral-200 shrink-0" />

        {tripType ? (
          <span className="text-sm text-neutral-600 font-medium shrink-0 hidden md:block">{getTripLabel()}</span>
        ) : (
          <span className="text-sm text-neutral-400 shrink-0 hidden md:block">체험학습 유형 미선택</span>
        )}

        <div className="flex-1 max-w-xs hidden lg:block">
          {tripType && <StepIndicator compact />}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-amber-400'}`} />
          <span className="text-xs text-neutral-500 hidden sm:block">{isReady ? 'API 연결됨' : 'API 미설정'}</span>
        </div>

        {tripType && (
          <button onClick={() => setShowReset(true)}
            className="text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 px-2 py-1.5 rounded-md transition-colors">
            처음부터
          </button>
        )}

        <button onClick={() => router.push('/doc-wizard/settings')}
          className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          aria-label="환경 설정">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <ConfirmModal isOpen={showReset} onClose={() => setShowReset(false)}
        onConfirm={handleGlobalReset}
        title="처음부터 시작" message="현재 작업 내용이 모두 초기화됩니다. 계속하시겠습니까?"
        confirmLabel="초기화" danger />
    </>
  );
}
