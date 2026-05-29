import React from 'react';

import StepIndicator from '@/components/trip-doc/common/StepIndicator';
import { useTripStore } from '@/store/tripStore';
import { useDocumentStore } from '@/store/documentStore';

import { useRouter } from 'next/navigation';

const STEP_ROUTES: Record<number, string> = {
  1: '/doc-wizard/step/type', 2: '/doc-wizard/step/school', 3: '/doc-wizard/step/excel',
  4: '/doc-wizard/step/place', 6: '/doc-wizard/step/input',
  7: '/doc-wizard/step/generate', 8: '/doc-wizard/step/preview', 9: '/doc-wizard/step/output',
};

export default function Sidebar() {
  const router         = useRouter();
  const tripType       = useTripStore((s) => s.tripType);
  const completedSteps = useTripStore((s) => s.completedSteps);
  const setCurrentStep = useTripStore((s) => s.setCurrentStep);
  const getDoneCount   = useDocumentStore((s) => s.getDoneCount);
  const totalTokenUsed = useDocumentStore((s) => s.totalTokenUsed);

  const handleStepClick = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber) && stepNumber !== 1) return;
    setCurrentStep(stepNumber);
    router.push(STEP_ROUTES[stepNumber]);
  };

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-neutral-200 bg-white h-full overflow-y-auto">
      <div className="p-4">
        <StepIndicator />
      </div>
      <div className="mx-4 border-t border-neutral-100" />
      {tripType && (
        <div className="p-4">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">서류 현황</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">생성 완료</span>
              <span className="font-semibold text-green-600">{getDoneCount()}종</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">사용 토큰</span>
              <span className="font-mono text-neutral-700">{totalTokenUsed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1" />
      <div className="p-4 border-t border-neutral-100">
        <p className="text-xs text-neutral-400 text-center">채움 v1.0.0</p>
      </div>
    </aside>
  );
}
