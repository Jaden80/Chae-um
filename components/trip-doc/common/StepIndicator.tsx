import React from 'react';
import { useTripStore } from '@/store/tripStore';

export interface StepConfig { number: number; label: string; sublabel?: string; }

export const STEPS: StepConfig[] = [
  { number: 1, label: '유형 선택',   sublabel: '체험학습 유형' },
  { number: 3, label: '엑셀 업로드', sublabel: '교직원·학생'  },
  { number: 4, label: '장소 정보',   sublabel: 'App-A 연계'   },
  { number: 6, label: '추가 입력',   sublabel: '세부 정보'    },
  { number: 7, label: '서류 생성',   sublabel: 'Gemini AI'    },
  { number: 8, label: '미리보기',    sublabel: '검토·편집'    },
  { number: 9, label: '출력',        sublabel: 'PDF/DOCX'     },
];

interface Props { visibleRange?: [number, number]; compact?: boolean; }

export default function StepIndicator({ visibleRange, compact = false }: Props) {
  const currentStep    = useTripStore((s) => s.currentStep);
  const completedSteps = useTripStore((s) => s.completedSteps);
  const steps = visibleRange
    ? STEPS.filter((s) => s.number >= visibleRange[0] && s.number <= visibleRange[1])
    : STEPS;

  const getDisplayStepNumber = (stepNum: number) => {
    const idx = STEPS.findIndex(s => s.number === stepNum);
    return idx !== -1 ? idx + 1 : 1;
  };

  const displayStepNum = getDisplayStepNumber(currentStep);

  if (compact) return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-blue-600">{displayStepNum}/{STEPS.length}단계</span>
      <span className="text-sm text-neutral-500">{STEPS.find((s) => s.number === currentStep)?.label}</span>
      <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${(displayStepNum / STEPS.length) * 100}%` }}
          role="progressbar" aria-valuenow={displayStepNum} aria-valuemin={1} aria-valuemax={STEPS.length} />
      </div>
    </div>
  );

  return (
    <nav aria-label="진행 단계" className="w-full">
      <ol className="flex flex-col gap-1">
        {steps.map((step, idx) => {
          const isDone    = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          return (
            <li key={step.number}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors
                ${isCurrent ? 'bg-blue-50 border border-blue-200' : isDone ? 'hover:bg-neutral-100' : 'opacity-50'}`}
                aria-current={isCurrent ? 'step' : undefined}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isCurrent ? 'bg-blue-600 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  {isDone ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx + 1}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-tight
                    ${isCurrent ? 'text-blue-600' : isDone ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    {step.label}
                  </p>
                  {step.sublabel && (
                    <p className="text-xs text-neutral-400 leading-tight mt-0.5">{step.sublabel}</p>
                  )}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="ml-6 my-0.5 w-px h-3 bg-neutral-200" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
